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

    // =========================================================================
    // BƯỚC 1: XÁC ĐỊNH VỊ TRÍ PLACEHOLDER {{subjectName}} ĐỂ CHÈN CỘT ĐỘNG
    // =========================================================================
    let startSubjectColIdx = -1;
    let headerRowIndex = -1;

    // Quét qua các dòng đầu bảng để tìm ô chứa {{subjectName}}
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

    // Nếu không tìm thấy placeholder, mặc định chọn cột K (cột 11) dòng 5 theo mô tả của bạn
    if (startSubjectColIdx === -1) {
      startSubjectColIdx = 11; // Cột K
      headerRowIndex = 5;
    }

    const headerRow = summarySheet.getRow(headerRowIndex);
    const sampleDataRow = summarySheet.getRow(7); // Dòng mẫu số 7 dùng để lấy style viền/font cho dữ liệu điểm

    // Lấy style gốc của ô chứa placeholder để áp dụng cho các tiêu đề môn học mới
    const baseHeaderStyle = JSON.parse(
      JSON.stringify(headerRow.getCell(startSubjectColIdx).style || {}),
    );

    // =========================================================================
    // BƯỚC 2: TẠO THÊM CÁC CỘT TƯƠNG ỨNG VỚI SỐ LƯỢNG MÔN HỌC (CHÈN ĐỘNG)
    // =========================================================================
    // Vì môn đầu tiên sẽ thay thế chính ô {{subjectName}}, chúng ta cần chèn thêm (N - 1) cột vào kế tiếp
    if (allSubjectsData.length > 1) {
      const columnsToInsert = allSubjectsData.length - 1;
      // Khởi tạo mảng rỗng để splice chèn cột trống, đẩy cột "Ghi chú" ra sau
      const emptyCols = Array(columnsToInsert).fill([]);
      summarySheet.spliceColumns(startSubjectColIdx + 1, 0, ...emptyCols);
    }

    // Cập nhật lại độ rộng cột cho các cột môn học vừa tạo (ví dụ width = 15)
    allSubjectsData.forEach((_, subIdx) => {
      summarySheet.getColumn(startSubjectColIdx + subIdx).width = 15;
    });

    // Điền tiêu đề tên môn học vào dòng tiêu đề chính
    allSubjectsData.forEach((subject, subIdx) => {
      const currentColIdx = startSubjectColIdx + subIdx;
      const cell = headerRow.getCell(currentColIdx);

      // Ghi tên môn học vào dòng tiêu đề
      cell.value =
        subject.keyValueData?.["subjectName"] ||
        subject.subjectName ||
        `Môn ${subIdx + 1}`;
      cell.style = baseHeaderStyle;
    });
    headerRow.commit();

    // =========================================================================
    // BƯỚC 3: GOM DỮ LIỆU ĐIỂM TỔNG KẾT (HỆ 10) CỦA TỪNG HỌC SINH THEO MÔN
    // =========================================================================
    const studentMap = new Map<
      string,
      {
        studentCode: string;
        fullName: string;
        dob: any;
        totalScores: number;
        subjectCount: number;
        // Map lưu điểm theo môn học: { [classSubjectId]: diem_tong_ket }
        subjectScores: Record<number, number | string>;
      }
    >();

    allSubjectsData.forEach((subject) => {
      const classSubjectId = subject.classSubjectId;
      const gradeTable = subject.gradeTable || [];

      gradeTable.forEach((item: any) => {
        if (!item.student || !item.student.studentCode) return;

        const studentCode = item.student.studentCode;

        // Lấy điểm tổng kết hệ 10 (Ưu tiên điểm tổng kết lần 2, không có thì lấy lần 1)
        const rawDiem =
          item.diemTongKet2 !== null &&
          item.diemTongKet2 !== undefined &&
          item.diemTongKet2 !== ""
            ? item.diemTongKet2
            : item.diemTongKet1;

        // Khởi tạo học sinh trong map nếu chưa tồn tại
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

        // Nếu có điểm tổng kết hợp lệ -> Lưu lại điểm hệ 10
        if (rawDiem !== null && rawDiem !== undefined && rawDiem !== "") {
          const diemTongKet10 = Number(rawDiem);

          studentData.totalScores += diemTongKet10;
          studentData.subjectCount += 1;
          studentData.subjectScores[classSubjectId] = diemTongKet10; // Đánh dấu điểm theo mã ID của đợt mở môn
        } else {
          studentData.subjectScores[classSubjectId] = ""; // Không có điểm hoặc vắng thi
        }
      });
    });

    // =========================================================================
    // BƯỚC 4: ĐỔ DỮ LIỆU ĐIỂM CHI TIẾT VÀ TỔNG HỢP VÀO SHEET
    // =========================================================================
    const startSummaryRowIndex = 7;
    let index = 0;

    studentMap.forEach((student) => {
      const currentRowNum = startSummaryRowIndex + index;
      const row = summarySheet.getRow(currentRowNum);

      // Thiết lập độ cao dòng đồng bộ với template
      row.height = sampleDataRow.height;

      // 4.1 Điền dữ liệu cố định ở các cột thông tin chung ban đầu (A -> G)
      row.getCell("A").value = index + 1; // STT
      row.getCell("B").value = student.studentCode; // MSV
      row.getCell("C").value = student.fullName; // Họ tên

      if (student.dob) {
        row.getCell("D").value = new Date(student.dob);
        row.getCell("D").numFmt = "dd/mm/yyyy";
      } else {
        row.getCell("D").value = "";
      }

      // Tính điểm trung bình học kỳ (ĐTB cộng dồn từ các môn thực tế học sinh đó có điểm)
      if (student.subjectCount < allSubjectsData.length) {
        row.getCell("E").value = "";
        row.getCell("F").value = "";
        row.getCell("G").value = "";
      } else {
        const avgHe10 = Number(
          (student.totalScores / student.subjectCount).toFixed(2),
        );
        const avgHe4 = this.convertHe10ToHe4(avgHe10);
        const diemChu = this.convertHe4ToDiemChu(avgHe4);

        row.getCell("E").value = avgHe10; // ĐTB Hệ 10
        row.getCell("F").value = avgHe4; // ĐTB Hệ 4
        row.getCell("G").value = diemChu; // Điểm chữ
      }

      // 4.2 Duyệt qua danh sách môn học để điền điểm tổng kết vào đúng cột môn học tương ứng
      allSubjectsData.forEach((subject, subIdx) => {
        const currentColIdx = startSubjectColIdx + subIdx;
        const cell = row.getCell(currentColIdx);

        const score = student.subjectScores[subject.classSubjectId];

        // Điền điểm tổng kết hệ 10 (Nếu có điểm thì ép kiểu Number, không thì bỏ trống)
        cell.value = score !== undefined && score !== "" ? Number(score) : "";
      });

      // 4.3 Áp style cho các cột còn lại ở phía sau môn học (Ví dụ cột Ghi chú bị đẩy ra sau)
      const totalColumns = summarySheet.columnCount;
      for (
        let colIdx = startSubjectColIdx + allSubjectsData.length;
        colIdx <= totalColumns;
        colIdx++
      ) {
        const cell = row.getCell(colIdx);
        // Lấy style từ cột gốc tương ứng bằng cách trừ đi lượng số cột môn học được chèn thêm
        const originalColIdx = colIdx - (allSubjectsData.length - 1);
        cell.style = JSON.parse(
          JSON.stringify(sampleDataRow.getCell(originalColIdx).style || {}),
        );
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
