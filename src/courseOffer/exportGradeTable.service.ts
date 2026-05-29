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

  private convertHe10ToDiemChu(diemHe10: number): string {
    if (diemHe10 >= 8.5) return "A";
    if (diemHe10 >= 7.0) return "B";
    if (diemHe10 >= 5.5) return "C";
    if (diemHe10 >= 4.0) return "D";
    return "F";
  }

  private convertDiemChuToHe4(diemChu: string): number {
    if (diemChu === "A") return 4.0;
    if (diemChu === "B") return 3.0;
    if (diemChu === "C") return 2.0;
    if (diemChu === "D") return 1.0;
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

  private convertDiem4ToXepLoai(diemHe4: number): string {
    if (diemHe4 >= 3.5) return "Xuất sắc";
    if (diemHe4 >= 3) return "Giỏi";
    if (diemHe4 >= 2.5) return "Khá";
    if (diemHe4 >= 2.0) return "Trung bình";
    return "Yếu";
  }

  /**
   * Hàm xử lý tính toán và dựng cấu trúc dữ liệu cho Sheet Tổng Kết
   */
  private buildSummarySheet(
    summarySheet: ExcelJS.Worksheet,
    allSubjectsData: any[],
  ) {
    // Định nghĩa border chuẩn cho tất cả các ô dữ liệu
    const cellBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Định nghĩa định dạng font chữ chuẩn (Không in đậm)
    // const regularFont: Partial<ExcelJS.Font> = {
    //   name: "Arial",
    //   size: 11,
    //   bold: false,
    //   color: { argb: "FF000000" },
    // };

    // Ghi semesterName
    const semesterName = allSubjectsData[0]?.keyValueData?.semesterName;
    summarySheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.value && typeof cell.value === "string") {
          if (cell.value.includes("{{semesterName}}")) {
            cell.value = cell.value.replace("{{semesterName}}", semesterName);
          }
        }
      });
    });

    // Lấy danh sách môn học để tạo cột điểm tổng kết từng môn
    const subjectsName = allSubjectsData?.map((s) => {
      return s.keyValueData?.subjectName;
    });

    // Chèn cột điểm từng môn
    // Tìm placeholder {{subjectName}}
    let rowForSubjects = -1;
    let columForSubjects = -1;
    for (let i = 1; i < 10; ++i) {
      const row = summarySheet.getRow(i);
      for (let j = 1; j <= row.cellCount; ++j) {
        const cellValue = row.getCell(j).value;
        if (
          cellValue &&
          typeof cellValue === "string" &&
          cellValue.includes("{{subjectName}}")
        ) {
          rowForSubjects = i;
          columForSubjects = j;
          break;
        }
      }
    }

    // Chèn cột subjects
    if (columForSubjects === -1) {
      columForSubjects = 11; // Mặc định cột K
      rowForSubjects = 4;
    }
    const headerSubjectColumnStyles = JSON.parse(
      JSON.stringify(
        summarySheet.getRow(rowForSubjects).getCell(columForSubjects).style,
      ),
    );
    if (subjectsName.length > 1) {
      summarySheet.spliceColumns(
        columForSubjects + 2,
        0,
        ...Array((subjectsName.length - 1) * 2).fill([]),
      );
    }

    // Ghi tên môn học vào cột
    subjectsName?.forEach((name, index) => {
      const cell = summarySheet
        .getRow(rowForSubjects)
        .getCell(columForSubjects + index * 2);
      cell.style = headerSubjectColumnStyles;
      cell.border = cellBorder as ExcelJS.Borders;
      cell.value = name;
      cell.alignment = {
        ...cell.alignment,
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      const cellDiemChu = summarySheet
        .getRow(rowForSubjects)
        .getCell(columForSubjects + index * 2 + 1);
      cellDiemChu.style = headerSubjectColumnStyles;
      cellDiemChu.border = cellBorder as ExcelJS.Borders;
      cellDiemChu.value = "";
      cellDiemChu.alignment = {
        ...cellDiemChu.alignment,
        vertical: "middle",
        horizontal: "center",
      };
    });

    summarySheet.mergeCells(
      rowForSubjects - 1,
      columForSubjects,
      rowForSubjects - 1,
      columForSubjects + subjectsName.length * 2 - 1,
    );
    const mergedCell = summarySheet
      .getRow(rowForSubjects - 1)
      .getCell(columForSubjects);

    mergedCell.alignment = {
      ...mergedCell.alignment,
      vertical: "middle",
      horizontal: "center",
    };

    // Xử lý dữ liệu điểm của từng sinh viên cho từng môn học
    const mainData = allSubjectsData[0]?.gradeTable?.map((student, index) => {
      let tongDiemHe10 = 0;
      let tongDiemHe4 = 0;
      let tongTinChi = 0;

      const diemTongKetTungMon = allSubjectsData?.map((subject) => {
        const grade = subject?.gradeTable?.filter(
          (g) => g.student.studentCode === student.student.studentCode,
        )[0];
        const rawDiem =
          grade?.diemTongKet2 !== null &&
          grade?.diemTongKet2 !== undefined &&
          grade?.diemTongKet2 !== ""
            ? grade.diemTongKet2
            : grade?.diemTongKet1; // ƯU tiên lấy điểm tổng kết 2

        tongDiemHe10 += Number(rawDiem) * subject?.keyValueData?.credits;
        tongDiemHe4 +=
          this.convertDiemChuToHe4(this.convertHe10ToDiemChu(Number(rawDiem))) *
          subject?.keyValueData?.credits;
        tongTinChi += subject?.keyValueData?.credits || 0;
        return rawDiem !== null && rawDiem !== undefined && rawDiem !== ""
          ? Number(rawDiem)
          : "";
      });

      const diemTBRaw = tongDiemHe10 / tongTinChi;
      const diemTBHe10 = tongTinChi > 0 ? Math.round(diemTBRaw * 10) / 10 : 0;

      const diemTBHe4 =
        tongTinChi > 0 ? Math.round((tongDiemHe4 / tongTinChi) * 100) / 100 : 0;
      const diemChu = this.convertHe10ToDiemChu(diemTBHe10);

      return {
        stt: index + 1,
        msv: student?.student?.studentCode,
        hoVaTen: student?.student?.fullName,
        ngaySinh: student?.student?.dob,
        diemTBHe10: diemTBHe10,
        diemTBHe4: diemTBHe4,
        diemChu: diemChu,
        xepLoaiHL: this.convertDiem4ToXepLoai(diemTBHe4),
        xepLoaiRLChu: "",
        xepLoaiRLDiem: "",
        diemTongKetTungMon: diemTongKetTungMon.flatMap((diem) => [
          diem,
          this.convertHe10ToDiemChu(Number(diem)),
        ]),
      };
    });

    // Đổ dữ liệu
    const startDataRowIndex = 5;
    mainData.forEach((student, index) => {
      const currentRowNum = startDataRowIndex + index;
      const row = summarySheet.getRow(currentRowNum);
      row.getCell(1).value = student.stt;
      row.getCell(2).value = student.msv;
      row.getCell(3).value = student.hoVaTen;
      row.getCell(4).value = student.ngaySinh ? new Date(student.ngaySinh) : "";
      row.getCell(4).numFmt = "dd/mm/yyyy";
      row.getCell(5).value = student.diemTBHe10;
      row.getCell(6).value = student.diemTBHe4;
      row.getCell(7).value = student.diemChu;
      row.getCell(8).value = student.xepLoaiHL;
      row.getCell(9).value = student.xepLoaiRLChu;
      row.getCell(10).value = student.xepLoaiRLDiem;
      student.diemTongKetTungMon.forEach((grade, subIndex) => {
        row.getCell(columForSubjects + subIndex).value = grade;
      });
      row.commit();
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
