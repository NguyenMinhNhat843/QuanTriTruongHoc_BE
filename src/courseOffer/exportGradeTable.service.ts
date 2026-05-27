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

    // Định nghĩa border chuẩn cho tất cả các ô dữ liệu
    const cellBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Định nghĩa định dạng font chữ chuẩn (Không in đậm)
    const regularFont: Partial<ExcelJS.Font> = {
      name: "Arial",
      size: 11,
      bold: false,
      color: { argb: "FF000000" },
    };

    // Định nghĩa định dạng căn giữa
    const centerAlignment: Partial<ExcelJS.Alignment> = {
      vertical: "middle",
      horizontal: "center",
    };

    summarySheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === "string") {
          if (cell.value.includes("{{semesterName}}")) {
            cell.value = cell.value.replace("{{semesterName}}", semesterName);
          }
        }
      });
    });

    // =========================================================================
    // Xác định placeholder {{subjectName}} để chèn điểm tổng kết từng môn
    // =========================================================================
    let startSubjectColIdx = -1;
    let headerRowIndex = -1;

    for (let r = 1; r <= 10; r++) {
      const row = summarySheet.getRow(r);
      for (let c = 1; c <= row.cellCount; c++) {
        const cellValue = row.getCell(c).value;
        if (
          cellValue &&
          typeof cellValue === "string" &&
          cellValue.includes("{{subjectName}}")
        ) {
          startSubjectColIdx = c;
          headerRowIndex = r;
          break;
        }
      }
      if (startSubjectColIdx !== -1) break;
    }

    if (startSubjectColIdx === -1) {
      startSubjectColIdx = 11; // Mặc định cột K
      headerRowIndex = 3;
    }

    const headerRow = summarySheet.getRow(headerRowIndex);
    const baseHeaderStyle = JSON.parse(
      JSON.stringify(headerRow.getCell(startSubjectColIdx).style || {}),
    );

    // Chèn thêm cột nếu có nhiều hơn 1 môn học
    if (allSubjectsData.length > 1) {
      const columnsToInsert = allSubjectsData.length - 1;
      const emptyCols = Array(columnsToInsert).fill([]);
      summarySheet.spliceColumns(startSubjectColIdx + 1, 0, ...emptyCols);
    }

    // Cập nhật độ rộng cột & điền tiêu đề môn học
    allSubjectsData.forEach((subject, subIdx) => {
      const currentColIdx = startSubjectColIdx + subIdx;
      summarySheet.getColumn(currentColIdx).width = 15;

      const cell = headerRow.getCell(currentColIdx);
      cell.value =
        subject.keyValueData?.["subjectName"] ||
        subject.subjectName ||
        `Môn ${subIdx + 1}`;
      cell.style = baseHeaderStyle;
      cell.border = cellBorder as ExcelJS.Borders;
    });
    headerRow.commit();

    // =========================================================================
    // BƯỚC 3: GOM DỮ LIỆU ĐIỂM TỔNG KẾT (HỆ 10)
    // =========================================================================
    const studentMap = new Map<string, any>();

    allSubjectsData.forEach((subject) => {
      const classSubjectId = subject.classSubjectId;
      const gradeTable = subject.gradeTable || [];

      gradeTable.forEach((item: any) => {
        if (!item.student || !item.student.studentCode) return;
        const studentCode = item.student.studentCode;

        const rawDiem =
          item.diemTongKet2 !== null &&
          item.diemTongKet2 !== undefined &&
          item.diemTongKet2 !== ""
            ? item.diemTongKet2
            : item.diemTongKet1;

        if (!studentMap.has(studentCode)) {
          studentMap.set(studentCode, {
            studentCode: studentCode,
            fullName: item.student.fullName,
            dob: item.student.dob,
            totalScores: 0,
            subjectCount: 0,
            subjectScores: {},
          });
        }

        const studentData = studentMap.get(studentCode)!;
        if (rawDiem !== null && rawDiem !== undefined && rawDiem !== "") {
          const diemTongKet10 = Number(rawDiem);
          studentData.totalScores += diemTongKet10;
          studentData.subjectCount += 1;
          studentData.subjectScores[classSubjectId] = diemTongKet10;
        } else {
          studentData.subjectScores[classSubjectId] = "";
        }
      });
    });

    // =========================================================================
    // Đổ dữ liệu điểm tổng kết từng học sinh
    // =========================================================================
    const startSummaryRowIndex = 5;
    let index = 0;
    const sampleDataRow = summarySheet.getRow(5);
    const baseRowHeight = sampleDataRow.height || 20;

    studentMap.forEach((student) => {
      const currentRowNum = startSummaryRowIndex + index;
      const row = summarySheet.getRow(currentRowNum);

      row.height = baseRowHeight;

      // 4.1 Điền thông tin chung (A -> G) + Thiết lập giao diện chuẩn văn bản
      const colsMapping = [
        { col: "A", val: index + 1, align: centerAlignment },
        { col: "B", val: student.studentCode, align: centerAlignment },
        {
          col: "C",
          val: student.fullName,
          align: { vertical: "middle", horizontal: "left" },
        },
      ];

      colsMapping.forEach((item) => {
        const cell = row.getCell(item.col);
        cell.value = item.val;
        cell.border = cellBorder as ExcelJS.Borders;
        cell.alignment = item.align as ExcelJS.Alignment;
        cell.font = regularFont as ExcelJS.Font; // Ép font không in đậm ở đây
      });

      // Xử lý Ngày sinh (Cột D)
      const cellD = row.getCell("D");
      if (student.dob) {
        cellD.value = new Date(student.dob);
        cellD.numFmt = "dd/mm/yyyy";
      } else {
        cellD.value = "";
      }
      cellD.border = cellBorder as ExcelJS.Borders;
      cellD.alignment = centerAlignment as ExcelJS.Alignment;
      cellD.font = regularFont as ExcelJS.Font;

      // Tính điểm trung bình học kỳ
      let avgHe10: any = "",
        avgHe4: any = "",
        diemChu = "";
      if (student.subjectCount >= allSubjectsData.length) {
        avgHe10 = Number(
          (student.totalScores / student.subjectCount).toFixed(2),
        );
        avgHe4 = this.convertHe10ToHe4(avgHe10);
        diemChu = this.convertHe4ToDiemChu(avgHe4);
      }

      const scoreCols = [
        { col: "E", val: avgHe10 },
        { col: "F", val: avgHe4 },
        { col: "G", val: diemChu },
      ];

      scoreCols.forEach((item) => {
        const cell = row.getCell(item.col);
        cell.value = item.val;
        cell.border = cellBorder as ExcelJS.Borders;
        cell.alignment = centerAlignment as ExcelJS.Alignment;
        cell.font = regularFont as ExcelJS.Font;
      });

      // 4.2 Duyệt điền điểm các môn học (Chèn border, căn giữa và xoá in đậm)
      allSubjectsData.forEach((subject, subIdx) => {
        const currentColIdx = startSubjectColIdx + subIdx;
        const cell = row.getCell(currentColIdx);
        const score = student.subjectScores[subject.classSubjectId];

        cell.value = score !== undefined && score !== "" ? Number(score) : "";

        cell.border = cellBorder as ExcelJS.Borders;
        cell.alignment = centerAlignment as ExcelJS.Alignment;
        cell.font = regularFont as ExcelJS.Font; // Đảm bảo các cột điểm động không bị đậm
      });

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
