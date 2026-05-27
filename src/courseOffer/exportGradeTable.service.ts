import { Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import * as path from "path";
import { CourseOfferQuery } from "./courseOffer.query";

@Injectable()
export class ExportGradeTableService {
  constructor(private courseOfferQuery: CourseOfferQuery) {}
  /**
   * Hàm helper dùng để sao chép dữ liệu, định dạng, merge cells từ sheet mẫu sang sheet mới
   */
  private cloneWorksheet(
    sourceSheet: ExcelJS.Worksheet,
    targetSheet: ExcelJS.Worksheet,
  ) {
    // 1. Sao chép độ rộng của các cột
    sourceSheet.columns.forEach((col, idx) => {
      if (col.width) {
        targetSheet.getColumn(idx + 1).width = col.width;
      }
    });

    // 2. Sao chép dữ liệu và định dạng từng ô
    sourceSheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
      const newRow = targetSheet.getRow(rowNum);
      newRow.height = row.height;

      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        const newCell = newRow.getCell(colNum);
        newCell.value = cell.value;
        newCell.style = JSON.parse(JSON.stringify(cell.style)); // Clone deep style (font, border, fill, alignment)
      });
    });

    // 3. Sao chép các ô bị gộp (Merged Cells)
    // Chuyển đổi qua chuỗi định dạng vì ExcelJS trả về cấu trúc đặc thù
    const mergedRanges = Object.keys((sourceSheet as any)._merges || {}).map(
      (key) => (sourceSheet as any)._merges[key].model,
    );
    mergedRanges.forEach((range) => {
      try {
        targetSheet.mergeCells(range);
      } catch (err: any) {
        console.log(err);
      }
    });
  }

  /**
   * Hàm helper quy đổi Điểm Hệ 10 sang Điểm Hệ 4
   */
  private convertHe10ToHe4(diemHe10: number): number {
    if (diemHe10 >= 8.5) return 4.0;
    if (diemHe10 >= 7.0) return 3.0;
    if (diemHe10 >= 5.5) return 2.0;
    if (diemHe10 >= 4.0) return 1.0;
    return 0.0;
  }

  /**
   * Hàm helper quy đổi Điểm Hệ 4 sang Điểm Chữ
   */
  private convertHe4ToDiemChu(diemHe4: number): string {
    if (diemHe4 === 4.0) return "A";
    if (diemHe4 === 3.0) return "B";
    if (diemHe4 === 2.0) return "C";
    if (diemHe4 === 1.0) return "D";
    return "F";
  }

  /**
   * Hàm xử lý tính toán và dựng cấu trúc dữ liệu cho Sheet Tổng Kết
   */
  private buildSummarySheet(
    summarySheet: ExcelJS.Worksheet,
    allSubjectsData: any[],
  ) {
    // 1. Thay thế placeholder {{semesterName}} trên sheet Tổng kết có sẵn
    const firstSubject = allSubjectsData[0];
    const semesterName =
      firstSubject?.keyValueData?.["semesterName"] || "Học kỳ";

    summarySheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === "string") {
          if (cell.value.includes("{{semesterName}}")) {
            cell.value = cell.value.replace("{{semesterName}}", semesterName);
          }
        }
      });
    });

    // 2. Gom và cộng dồn điểm từ tất cả các môn học phần
    const studentMap = new Map<
      string,
      {
        studentCode: string;
        fullName: string;
        dob: any;
        totalScores: number;
        subjectCount: number;
      }
    >();

    allSubjectsData.forEach((subject) => {
      const gradeTable = subject.gradeTable || [];
      gradeTable.forEach((item: any) => {
        if (!item.student || !item.student.studentCode) return;

        const studentCode = item.student.studentCode;

        const rawDiem =
          item.diemTongKet2 !== null && item.diemTongKet2 !== undefined
            ? item.diemTongKet2
            : item.diemTongKet1;

        if (rawDiem === null || rawDiem === undefined || rawDiem === "") {
          if (!studentMap.has(studentCode)) {
            studentMap.set(studentCode, {
              studentCode: studentCode,
              fullName: item.student.fullName,
              dob: item.student.dob,
              totalScores: 0,
              subjectCount: 0,
            });
          }
          return;
        }

        // Lấy điểm tổng kết (ưu tiên lần 2, ko có thì lấy lần 1)
        const diemTongKet10 = Number(rawDiem);

        if (!studentMap.has(studentCode)) {
          studentMap.set(studentCode, {
            studentCode: studentCode,
            fullName: item.student.fullName,
            dob: item.student.dob,
            totalScores: diemTongKet10,
            subjectCount: 1,
          });
        } else {
          const currentData = studentMap.get(studentCode)!;
          currentData.totalScores += diemTongKet10;
          currentData.subjectCount += 1;
        }
      });
    });

    // 3. Đổ dữ liệu tổng hợp vào sheet Tổng kết có sẵn từ dòng số 7
    const startSummaryRowIndex = 7;

    let index = 0;
    studentMap.forEach((student) => {
      const currentRowNum = startSummaryRowIndex + index;
      const row = summarySheet.getRow(currentRowNum);

      // Lấy dòng số 9 của template gốc (dòng chứa format điểm chuẩn) để kế thừa style
      const sampleRow = summarySheet.getRow(7);
      row.height = sampleRow.height;

      // Kế thừa style và set border cho 7 cột (Từ A đến G)
      for (let colIdx = 1; colIdx <= 7; colIdx++) {
        const cell = row.getCell(colIdx);
        cell.style = JSON.parse(
          JSON.stringify(sampleRow.getCell(colIdx).style),
        );
      }

      // Điền data vào từng ô theo đúng thứ tự bạn yêu cầu
      row.getCell("A").value = index + 1; // STT
      row.getCell("B").value = student.studentCode; // MSV
      row.getCell("C").value = student.fullName; // Họ tên

      // Xử lý Ngày sinh
      if (student.dob) {
        row.getCell("D").value = new Date(student.dob);
        row.getCell("D").numFmt = "dd/mm/yyyy";
      } else {
        row.getCell("D").value = "";
      }

      if (student.subjectCount === 0) {
        // Nếu học sinh này không có bất kỳ môn nào vào điểm -> Để trống hoàn toàn ô Excel
        row.getCell("E").value = ""; // Hệ 10 trống
        row.getCell("F").value = ""; // Hệ 4 trống
        row.getCell("G").value = ""; // Điểm chữ trống
      } else {
        // Nếu có ít nhất 1 môn có điểm -> Tính trung bình trên các môn thực tế đó
        const avgHe10 = Number(
          (student.totalScores / student.subjectCount).toFixed(2),
        );
        const avgHe4 = this.convertHe10ToHe4(avgHe10);
        const diemChu = this.convertHe4ToDiemChu(avgHe4);

        row.getCell("E").value = avgHe10; // Điền ĐTB Hệ 10
        row.getCell("F").value = avgHe4; // Điền ĐTB Hệ 4
        row.getCell("G").value = diemChu; // Điền Điểm chữ
      }

      row.commit();
      index++;
    });
  }

  /**
   * Hàm xuất chính tập hợp nhiều môn và đính kèm sheet Tổng kết học kỳ
   */
  async exportMultipleSubjectsToExcel(
    classSubjectIds: number[],
    haveTongKetSheet: boolean = false,
  ): Promise<Buffer> {
    const templatePath = path.join(
      process.cwd(),
      "dist",
      "assets",
      "bangdiem_template.xlsx",
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // CHÚ Ý VỊ TRÍ SHEET TRONG TEMPLATE CỦA BẠN:
    const templateSheet = workbook.worksheets[0]; // Sheet 1: Khuôn mẫu môn học
    const summarySheet = workbook.worksheets[1]; // Sheet 2: Sheet Tổng kết có sẵn của bạn

    // Tải dữ liệu bất đồng bộ toàn bộ môn học phần
    const allSubjectsData = await Promise.all(
      classSubjectIds.map(async (id) => {
        const data = await this.courseOfferQuery.queryDataForExportExcel(id);
        return { classSubjectId: id, ...data };
      }),
    );

    const startGradeColumnIndex = 9; // Dòng bắt đầu đổ điểm học sinh ở sheet môn học
    const cellBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "#000000" } },
      left: { style: "thin", color: { argb: "#000000" } },
      bottom: { style: "thin", color: { argb: "#000000" } },
      right: { style: "thin", color: { argb: "#000000" } },
      diagonal: { up: false, down: false, color: { argb: "" } },
    };

    // Luồng tuần tự tạo các sheet môn học
    allSubjectsData.forEach((subjectData, subIndex) => {
      const { keyValueData, gradeTable } = subjectData;

      let sheetName = `${subIndex + 1}-${keyValueData["subjectName"] || "MonHoc"}`;
      sheetName = sheetName.replace(/[/\\?*:[\]]/g, "").substring(0, 31);

      const newWorksheet = workbook.addWorksheet(sheetName);
      this.cloneWorksheet(templateSheet, newWorksheet);

      // Điền placeholder thông tin môn học
      newWorksheet.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.value && typeof cell.value === "string") {
            let cellString = cell.value;
            const matches = cellString.match(/{{(.*?)}}/g);
            if (matches) {
              matches.forEach((match) => {
                const key = match.replace("{{", "").replace("}}", "").trim();
                if (keyValueData[key] !== undefined) {
                  cellString = cellString.replace(match, keyValueData[key]);
                }
              });
              cell.value = cellString;
            }
          }
        });
      });

      // Đổ dữ liệu chi tiết điểm của từng môn
      gradeTable.forEach((item: any, index: number) => {
        const currentRowNum = startGradeColumnIndex + index;
        const row = newWorksheet.getRow(currentRowNum);

        const sampleRow = templateSheet.getRow(startGradeColumnIndex);
        row.height = sampleRow.height;

        for (let colIdx = 1; colIdx <= 17; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.style = JSON.parse(
            JSON.stringify(sampleRow.getCell(colIdx).style),
          );
          cell.border = cellBorder as ExcelJS.Borders;
        }

        row.getCell("A").value = index + 1;
        row.getCell("B").value = item.student.studentCode;
        row.getCell("C").value = item.student.fullName;

        if (item.student.dob) {
          const dobDate = new Date(item.student.dob);
          row.getCell("D").value = dobDate;
          row.getCell("D").numFmt = "dd/mm/yyyy";
        } else {
          row.getCell("D").value = "";
        }

        row.getCell("E").value = item.kttx1;
        row.getCell("F").value = item.kttx2;
        row.getCell("G").value = item.kttx3;
        row.getCell("H").value = item.ktdk1;
        row.getCell("I").value = item.ktdk2;
        row.getCell("J").value = item.ktdk3;
        row.getCell("K").value = item.ktdk4;
        row.getCell("L").value = item.diemTB;
        row.getCell("M").value = item.diemKiemTra1;
        row.getCell("N").value = item.diemKiemTra2;
        row.getCell("O").value = item.diemTongKet1;
        row.getCell("P").value = item.diemTongKet2;
        row.getCell("Q").value = item.note;

        row.commit();
      });
    });

    // 4. GỌI HÀM RIÊNG ĐỂ ĐIỀN DỮ LIỆU VÀO SHEET TỔNG KẾT CÓ SẴN
    if (haveTongKetSheet) {
      this.buildSummarySheet(summarySheet, allSubjectsData);
    } else {
      // Nếu không cần sheet Tổng kết, xóa sheet này đi để tránh bị thừa
      workbook.removeWorksheet(summarySheet.id);
    }

    // 5. Xóa sheet 1 khuôn mẫu trống ban đầu đi
    workbook.removeWorksheet(templateSheet.id);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return buffer;
  }
}
