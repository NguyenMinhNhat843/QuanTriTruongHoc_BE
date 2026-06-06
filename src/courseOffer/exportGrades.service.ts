import { Injectable, NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { CourseOfferQuery } from "./classSubject.query";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ExportGradeTableService {
  constructor(
    private courseOfferQuery: CourseOfferQuery,
    private prisma: PrismaService,
  ) {}
  /**
   * Bộ style chuẩn Giáo dục định nghĩa sẵn để tái sử dụng
   */
  private readonly DEFAULT_FONT = { name: "Times New Roman", size: 11 };
  private readonly BOLD_FONT = {
    name: "Times New Roman",
    size: 11,
    bold: true,
  };
  private readonly TITLE_FONT = {
    name: "Times New Roman",
    size: 16,
    bold: true,
  };

  private readonly CELL_BORDER: ExcelJS.Borders = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
    diagonal: { style: "thin", color: { argb: "FF000000" } },
  };

  private readonly CENTER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };

  /**
   * Các hàm helper quy đổi điểm giữ nguyên logic cũ
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
   * Định dạng độ rộng cột mặc định cho Sheet môn học
   */
  private setSubjectSheetColumnWidths(sheet: ExcelJS.Worksheet) {
    const widths = [6, 15, 25, 12, 8, 8, 8, 8, 8, 8, 8, 10, 12, 12, 14, 14, 15]; // Cột A -> Q
    widths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });
  }

  /**
   * Hàm helper tự động tạo cấu trúc Header chuẩn cho sheet Môn học
   */
  private drawSubjectHeader(sheet: ExcelJS.Worksheet, keyValueData: any) {
    this.setSubjectSheetColumnWidths(sheet);

    // Dòng 1: Tiêu đề lớn
    sheet.mergeCells("A1:Q1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "KẾT QUẢ HỌC TẬP MÔN HỌC/MÔ ĐUN";
    titleCell.font = this.TITLE_FONT;
    titleCell.alignment = this.CENTER_ALIGNMENT;
    sheet.getRow(1).height = 30;

    // Dòng 2: Học kỳ (Góc phải)
    sheet.mergeCells("O2:Q2");
    const semesterCell = sheet.getCell("O2");
    semesterCell.value = keyValueData?.semesterName || "";
    semesterCell.font = this.BOLD_FONT;
    semesterCell.alignment = { vertical: "middle", horizontal: "right" };

    // Dòng 3: Thông tin Meta của môn học
    sheet.getRow(3).height = 22;
    sheet.getCell("A3").value =
      `Môn học/Mô đun: ${keyValueData?.subjectName || ""}`;
    sheet.getCell("A3").font = this.BOLD_FONT;
    sheet.mergeCells("A3:E3");

    sheet.getCell("F3").value = `Số TC/DVHT: ${keyValueData?.credits || ""}`;
    sheet.getCell("F3").font = this.BOLD_FONT;
    sheet.mergeCells("F3:I3");

    sheet.getCell("J3").value = `Lớp: ${keyValueData?.className || ""}`;
    sheet.getCell("J3").font = this.BOLD_FONT;
    sheet.mergeCells("J3:M3");

    sheet.getCell("N3").value = `Giáo viên: ${keyValueData?.teacherName || ""}`;
    sheet.getCell("N3").font = this.BOLD_FONT;
    sheet.mergeCells("N3:Q3");

    // Dòng 4 - 8: Tạo bảng tiêu đề cột (Header của table điểm)
    sheet.getRow(4).height = 40;
    sheet.getRow(5).height = 20;
    sheet.getRow(6).height = 20;
    sheet.getRow(7).height = 20;
    sheet.getRow(8).height = 20;

    // Định nghĩa cấu trúc merge chuẩn xác - KHÔNG trùng lặp ô
    const headers = [
      { cell: "A4", merge: "A4:A8", val: "STT" },
      { cell: "B4", merge: "B4:B8", val: "Mã SV/HS" },
      { cell: "C4", merge: "C4:C8", val: "Họ và tên học sinh" },
      { cell: "D4", merge: "D4:D8", val: "Ngày sinh" },
      { cell: "E4", merge: "E4:G4", val: "Kiểm tra thường xuyên\n(Hệ số 1)" },
      { cell: "E5", merge: "E5:E8", val: "TX1" },
      { cell: "F5", merge: "F5:F8", val: "TX2" },
      { cell: "G5", merge: "G5:G8", val: "TX3" },
      { cell: "H4", merge: "H4:K4", val: "Kiểm tra định kỳ\n(Hệ số 2)" },
      { cell: "H5", merge: "H5:H8", val: "ĐK1" },
      { cell: "I5", merge: "I5:I8", val: "ĐK2" },
      { cell: "J5", merge: "J5:J8", val: "ĐK3" },
      { cell: "K5", merge: "K5:K8", val: "ĐK4" },
      { cell: "L4", merge: "L4:L8", val: "Điểm TB\n(Hệ 10)" },
      { cell: "M4", merge: "M4:N4", val: "Điểm kiểm tra\n(Hệ số 3)" },
      { cell: "M5", merge: "M5:M8", val: "Lần 1" },
      { cell: "N5", merge: "N5:N8", val: "Lần 2" },
      { cell: "O4", merge: "O4:P4", val: "Điểm tổng kết môn" }, // Đã xóa ô rác gây trùng lặp
      { cell: "O5", merge: "O5:O8", val: "Lần 1" },
      { cell: "P5", merge: "P5:P8", val: "Lần 2" },
      { cell: "Q4", merge: "Q4:Q8", val: "Ghi chú" },
    ];

    headers.forEach((h) => {
      try {
        sheet.mergeCells(h.merge);
        const c = sheet.getCell(h.cell);
        c.value = h.val;
      } catch (err) {
        console.error(`Lỗi tại ô merge: ${h.merge}`, err);
      }
    });

    // Style toàn bộ khối Header Table từ dòng 4 đến dòng 8
    for (let r = 4; r <= 8; r++) {
      for (let c = 1; c <= 17; c++) {
        const cell = sheet.getCell(r, c);
        cell.font = this.BOLD_FONT;
        cell.alignment = this.CENTER_ALIGNMENT;
        cell.border = this.CELL_BORDER;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F2F2F2" },
        };
      }
    }
  }

  /**
   * Hàm xử lý tính toán và dựng cấu trúc dữ liệu cho Sheet Tổng Kết
   */
  private buildSummarySheet(
    summarySheet: ExcelJS.Worksheet,
    allSubjectsData: any[],
  ) {
    // 1. DỰNG LAYOUT HEADER CHO SHEET TỔNG KẾT (Bám sát theo ảnh đính kèm)
    summarySheet.mergeCells("A1:J1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "KẾT QUẢ HỌC TẬP MÔN HỌC/MÔ ĐUN";
    titleCell.font = this.TITLE_FONT;
    titleCell.alignment = this.CENTER_ALIGNMENT;
    summarySheet.getRow(1).height = 30;

    const semesterName = allSubjectsData[0]?.keyValueData?.semesterName || "";
    summarySheet.getCell("K2").value = semesterName;
    summarySheet.getCell("K2").font = this.BOLD_FONT;
    summarySheet.getCell("K2").alignment = {
      vertical: "middle",
      horizontal: "right",
    };

    // Thiết lập độ rộng cơ bản cố định cho các cột thông tin gốc (Cột 1 đến 10)
    const baseWidths = [6, 25, 15, 12, 12, 12, 10, 12, 12, 12]; // STT, Họ Tên, Ngày Sinh, Điểm TB,...
    baseWidths.forEach((w, idx) => {
      summarySheet.getColumn(idx + 1).width = w;
    });

    // Định nghĩa Header cố định từ cột A đến J bám chuẩn theo cấu trúc ảnh của bạn
    // Vì hàng môn học chiếm từ dòng 3 đến dòng 4 nên gom nhóm merge hợp lý
    const baseHeaders = [
      { cell: "A3", merge: "A3:A4", val: "STT" },
      { cell: "B3", merge: "B3:B4", val: "Họ và tên học sinh" },
      { cell: "C3", merge: "C3:C4", val: "Ngày sinh" },
      { cell: "D3", merge: "D3:D4", val: "Điểm TB\n(hệ 10)" },
      { cell: "E3", merge: "E3:E4", val: "Điểm TB\n(hệ 4)" },
      { cell: "F3", merge: "F3:F4", val: "Điểm\nchữ" },
      { cell: "G3", merge: "G3:G4", val: "Xếp\nloại HL" },
      { cell: "H3", merge: "H3:H4", val: "Xếp\nloại RL" },
      { cell: "I3", merge: "I3:I4", val: "Xếp\nloại RL\n(điểm)" },
      { cell: "J3", merge: "J3:J4", val: "Ghi\nchú" },
    ];

    baseHeaders.forEach((h) => {
      summarySheet.mergeCells(h.merge);
      const cell = summarySheet.getCell(h.cell);
      cell.value = h.val;
    });

    // Lấy danh sách tên môn học phần động [cite: 104]
    const subjectsName =
      allSubjectsData?.map((s) => s.keyValueData?.subjectName) || [];
    const columnForSubjects = 11; // Bắt đầu chèn từ cột K (Cột số 11) [cite: 128]
    const totalSubjectColumns = subjectsName.length * 2;

    // Vẽ khối Group tiêu đề lớn "Tên Module / Môn học" nằm tại dòng 3 [cite: 170-173]
    if (subjectsName.length > 0) {
      const startColLetter = summarySheet.getColumn(columnForSubjects).letter;
      const endColLetter = summarySheet.getColumn(
        columnForSubjects + totalSubjectColumns - 1,
      ).letter;
      summarySheet.mergeCells(`${startColLetter}3:${endColLetter}3`);

      const mainSubjectHeaderCell = summarySheet.getCell(`${startColLetter}3`);
      mainSubjectHeaderCell.value = "Tên Module / Môn học";
      mainSubjectHeaderCell.font = this.BOLD_FONT;
      mainSubjectHeaderCell.alignment = this.CENTER_ALIGNMENT;
    }

    // Điền chi tiết từng tên môn học vào dòng 4 [cite: 144, 146, 170]
    subjectsName.forEach((name, index) => {
      const subColIdx = columnForSubjects + index * 2;

      // Đặt độ rộng cho 2 cột nhỏ của môn học đó (Cột Điểm và Cột Chữ)
      summarySheet.getColumn(subColIdx).width = 14;
      summarySheet.getColumn(subColIdx + 1).width = 6;

      // Merge 2 ô tại dòng 4 lại để ghi tên môn học trải rộng ra mắt nhìn cân đối hơn
      const cellSubNameStart = summarySheet.getColumn(subColIdx).letter + "4";
      const cellSubNameEnd = summarySheet.getColumn(subColIdx + 1).letter + "4";
      summarySheet.mergeCells(`${cellSubNameStart}:${cellSubNameEnd}`);

      const subCell = summarySheet.getCell(cellSubNameStart);
      subCell.value = name;
      subCell.font = this.BOLD_FONT;
      subCell.alignment = this.CENTER_ALIGNMENT;
    });

    // Style bọc nền và viền cho toàn bộ vùng Header (Dòng 3 & Dòng 4, từ cột 1 đến hết cột môn học)
    const totalColumnsCount = 10 + totalSubjectColumns;
    for (let r = 3; r <= 4; r++) {
      for (let c = 1; c <= totalColumnsCount; c++) {
        const cell = summarySheet.getCell(r, c);
        cell.font = this.BOLD_FONT;
        cell.alignment = this.CENTER_ALIGNMENT;
        cell.border = this.CELL_BORDER;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F2F2F2" },
        };
      }
    }

    // 2. XỬ LÝ DỮ LIỆU ĐIỂM & TÍNH TOÁN (Giữ nguyên logic gốc của bạn) [cite: 183-184]
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
            : grade?.diemTongKet1; // Ưu tiên lấy điểm tổng kết 2 [cite: 192-197]

        tongDiemHe10 += Number(rawDiem) * subject?.keyValueData?.credits;
        // Thực hiện đổi sang Điểm chữ trước rồi mới từ Điểm chữ đổi sang Hệ 4 đúng như bạn mong muốn [cite: 199-201]
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
        diemTongKetTungMon: diemTongKetTungMon.flatMap((diem) => {
          if (diem === "") return ["", ""];
          return [diem, this.convertHe10ToDiemChu(Number(diem))];
        }),
      };
    });

    // 3. ĐỔ DỮ LIỆU VÀO SHEET TỔNG KẾT (Bắt đầu từ dòng số 5) [cite: 230]
    const startDataRowIndex = 5;
    mainData?.forEach((student, index) => {
      const currentRowNum = startDataRowIndex + index;
      const row = summarySheet.getRow(currentRowNum);
      row.height = 22; // Chiều cao hàng dữ liệu hợp lý nhìn thông thoáng

      row.getCell(1).value = student.stt;
      row.getCell(2).value = student.hoVaTen; // Map đúng vị trí cột giao diện mới

      if (student.ngaySinh) {
        row.getCell(3).value = new Date(student.ngaySinh);
        row.getCell(3).numFmt = "dd/mm/yyyy";
      } else {
        row.getCell(3).value = "";
      }

      row.getCell(4).value = student.diemTBHe10;
      row.getCell(4).numFmt = "0.0"; // Ép hiển thị 1 chữ số thập phân chuẩn giáo dục

      row.getCell(5).value = student.diemTBHe4;
      row.getCell(5).numFmt = "0.00"; // Hệ 4 ép hiển thị 2 chữ số thập phân

      row.getCell(6).value = student.diemChu;
      row.getCell(7).value = student.xepLoaiHL;
      row.getCell(8).value = student.xepLoaiRLChu;
      row.getCell(9).value = student.xepLoaiRLDiem;
      row.getCell(10).value = ""; // Ghi chú trống

      // Đổ điểm môn học phần động (Bắt đầu từ cột K tương ứng) [cite: 245-246]
      student.diemTongKetTungMon.forEach((grade, subIndex) => {
        const cell = row.getCell(columnForSubjects + subIndex);
        cell.value = grade;
        // Nếu là cột điểm số, định dạng format hiển thị số đẹp
        if (typeof grade === "number" && subIndex % 2 === 0) {
          cell.numFmt = "0.0";
        }
      });

      // Format font, lề, border đồng bộ cho toàn bộ hàng dữ liệu hiện tại
      for (let c = 1; c <= totalColumnsCount; c++) {
        const cell = row.getCell(c);
        cell.font = this.DEFAULT_FONT;
        cell.border = this.CELL_BORDER;

        // Riêng cột họ và tên thì căn lề Trái (Left), còn lại căn Giữa (Center)
        if (c === 2) {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            indent: 1,
          };
        } else {
          cell.alignment = this.CENTER_ALIGNMENT;
        }
      }
      row.commit();
    });
  }

  /**
   * Hàm xuất chính tập hợp nhiều môn và đính kèm sheet Tổng kết học kỳ
   * Bỏ hoàn toàn Template File, tự dựng form từ đầu
   */
  async exportMultipleSubjectsToExcel(
    classSubjectIds: number[],
    haveTongKetSheet: boolean = false,
  ): Promise<Buffer> {
    // Khởi tạo Workbook trắng mới tinh, không đọc file template nữa [cite: 264-265]
    const workbook = new ExcelJS.Workbook();

    // Tải dữ liệu bất đồng bộ toàn bộ môn học phần [cite: 269-270]
    const allSubjectsData = await Promise.all(
      classSubjectIds.map(async (id) => {
        const data = await this.courseOfferQuery.queryDataForExportExcel(id);
        return { classSubjectId: id, ...data };
      }),
    );

    const startGradeColumnIndex = 9; // Dòng bắt đầu đổ điểm học sinh ở sheet môn học [cite: 276]

    // Luồng tạo tuần tự các sheet môn học [cite: 284]
    allSubjectsData.forEach((subjectData, subIndex) => {
      const { keyValueData, gradeTable } = subjectData;

      let sheetName = `${subIndex + 1}-${keyValueData["subjectName"] || "MonHoc"}`;
      sheetName = sheetName.replace(/[/\\?*:[\]]/g, "").substring(0, 31); // Tránh lỗi ký tự đặc biệt [cite: 288]

      const newWorksheet = workbook.addWorksheet(sheetName);

      // Tự dựng Header cho sheet môn học thay vì clone từ template trống [cite: 290]
      this.drawSubjectHeader(newWorksheet, keyValueData);

      // Đổ dữ liệu chi tiết điểm của môn học hiện hành [cite: 309]
      gradeTable.forEach((item: any, index: number) => {
        const currentRowNum = startGradeColumnIndex + index;
        const row = newWorksheet.getRow(currentRowNum);
        row.height = 22; // Chiều cao dòng chuẩn, thoáng mắt

        // Điền các ô dữ liệu cơ bản [cite: 322-324]
        row.getCell("A").value = index + 1;
        row.getCell("B").value = item.student.studentCode;
        row.getCell("C").value = item.student.fullName;

        if (item.student.dob) {
          row.getCell("D").value = new Date(item.student.dob);
          row.getCell("D").numFmt = "dd/mm/yyyy"; // Định dạng hiển thị ngày sinh [cite: 328]
        } else {
          row.getCell("D").value = "";
        }

        // Điền các cột điểm [cite: 332-344]
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
        row.getCell("Q").value = item.note || "";

        // Định dạng số (Decimal Format) cho toàn bộ các ô chứa điểm số [cite: 332-343]
        const scoreCols = [
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "N",
          "O",
          "P",
        ];
        scoreCols.forEach((col) => {
          const cell = row.getCell(col);
          if (typeof cell.value === "number") {
            cell.numFmt = "0.0";
          }
        });

        // Áp dụng Style đồng loạt (Font, Border, Alignment) cho hàng dữ liệu này [cite: 317-320]
        for (let colIdx = 1; colIdx <= 17; colIdx++) {
          const cell = row.getCell(colIdx);
          cell.font = this.DEFAULT_FONT;
          cell.border = this.CELL_BORDER;

          if (colIdx === 3) {
            // Tên học sinh căn lề trái cho dễ đọc [cite: 324]
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              indent: 1,
            };
          } else {
            // Các dữ liệu khác căn giữa toàn bộ [cite: 322-323, 325-344]
            cell.alignment = this.CENTER_ALIGNMENT;
          }
        }

        row.commit();
      });
    });

    // Tạo sheet tổng kết nếu tham số yêu cầu bật lên [cite: 349]
    if (haveTongKetSheet) {
      const summarySheet = workbook.addWorksheet("TongKetHocKy");
      this.buildSummarySheet(summarySheet, allSubjectsData);
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer()); // Ghi đè buffer sạch ra ngoài [cite: 357]
    return buffer;
  }

  /**
   * Hàm xuất điểm của 1 học sinh
   */
  async exportExcelGradeForOneStudent(studentId: number): Promise<Buffer> {
    const studentTranscript = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        class: {
          select: {
            classCode: true,
            className: true,
          },
        },
        courseRegistrations: {
          select: {
            id: true,
            kttx1: true,
            kttx2: true,
            kttx3: true,
            ktdk1: true,
            ktdk2: true,
            ktdk3: true,
            ktdk4: true,
            diemTB: true,
            diemKiemTra1: true,
            diemKiemTra2: true,
            diemTongKet1: true,
            diemTongKet2: true,
            rating: true,
            note: true,
            courseOffer: {
              select: {
                subject: {
                  select: {
                    subjectCode: true,
                    subjectName: true,
                    credits: true,
                  },
                },
                semester: {
                  select: {
                    id: true,
                    name: true,
                    schoolYear: true,
                    term: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!studentTranscript) {
      throw new NotFoundException(
        `Không tìm thấy học sinh có ID:  ${studentId}`,
      );
    }

    // ==========================================
    // STEP 1: XỬ LÝ DỮ LIỆU SẠCH (GOM NHÓM THEO HỌC KỲ)
    // ==========================================
    const semesterMap = new Map<number, any>();

    studentTranscript.courseRegistrations.forEach((reg) => {
      const courseOffer = reg.courseOffer;
      if (!courseOffer || !courseOffer.semester) return;

      const semester = courseOffer.semester;
      const semesterId = semester.id;

      if (!semesterMap.has(semesterId)) {
        semesterMap.set(semesterId, {
          semesterId: semester.id,
          semesterName: semester.name,
          schoolYear: semester.schoolYear,
          term: semester.term,
          grades: [],
        });
      }

      const subjectInfo = courseOffer.subject;

      // Giữ nguyên giá trị điểm gốc, nếu null thì hiển thị dấu "-"
      semesterMap.get(semesterId).grades.push({
        subjectCode: subjectInfo?.subjectCode || "",
        subjectName: subjectInfo?.subjectName || "",
        credits: subjectInfo?.credits || 0,
        kttx1: reg.kttx1 ?? "-",
        kttx2: reg.kttx2 ?? "-",
        kttx3: reg.kttx3 ?? "-",
        ktdk1: reg.ktdk1 ?? "-",
        ktdk2: reg.ktdk2 ?? "-",
        ktdk3: reg.ktdk3 ?? "-",
        ktdk4: reg.ktdk4 ?? "-",
        diemTB: reg.diemTB ?? "-",
        diemKiemTra1: reg.diemKiemTra1 ?? "-",
        diemKiemTra2: reg.diemKiemTra2 ?? "-",
        diemTongKet1: reg.diemTongKet1 ?? "-",
        diemTongKet2: reg.diemTongKet2 ?? "-",
        rating: reg.rating || "",
        note: reg.note || "",
      });
    });

    // Sắp xếp các học kỳ theo dòng thời gian (Năm học -> Học kỳ)
    const dataResult = Array.from(semesterMap.values()).sort((a, b) => {
      if (a.schoolYear !== b.schoolYear) {
        return a.schoolYear.localeCompare(b.schoolYear);
      }
      return a.term - b.term;
    });

    // ==========================================
    // STEP 2: KHỞI TẠO FILE EXCEL VÀ STYLE
    // ==========================================
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bảng điểm cá nhân");

    // Cấu hình lại độ rộng cho tổng cộng 15 cột mới
    worksheet.columns = [
      { width: 6 }, // STT
      { width: 12 }, // Mã môn
      { width: 25 }, // Tên môn học
      { width: 8 }, // Số TC
      { width: 10 }, // KTTX 1
      { width: 10 }, // KTTX 2
      { width: 10 }, // KTTX 3
      { width: 10 }, // KTĐK 1
      { width: 10 }, // KTĐK 2
      { width: 10 }, // KTĐK 3
      { width: 10 }, // KTĐK 4
      { width: 10 }, // Điểm TB
      { width: 12 }, // Tổng kết 1
      { width: 12 }, // Tổng kết 2
      { width: 12 }, // Đánh giá
      { width: 18 }, // Ghi chú
    ];

    // --- 1. Tiêu đề chính của file Excel ---
    worksheet.mergeCells("A1:P1"); // Mở rộng merge vùng cell từ A đến P
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "BẢNG ĐIỂM TỔNG HỢP HỌC SINH";
    titleCell.font = {
      name: "Arial",
      size: 16,
      bold: true,
      color: { argb: "FF1F497D" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 35;

    // --- 2. Thông tin học sinh ở góc trên ---
    worksheet.getCell("A3").value = "Mã học sinh:";
    worksheet.getCell("A3").font = { bold: true };
    worksheet.getCell("B3").value = studentTranscript.studentCode;

    worksheet.getCell("D3").value = "Họ và tên:";
    worksheet.getCell("D3").font = { bold: true };
    worksheet.getCell("E3").value = studentTranscript.fullName;

    worksheet.getCell("H3").value = "Lớp học:";
    worksheet.getCell("H3").font = { bold: true };
    worksheet.getCell("I3").value =
      studentTranscript.class?.className || "Chưa xếp lớp";

    let currentRow = 5;

    // ==========================================
    // STEP 3: VÒNG LẶP RENDER DỮ LIỆU TỪNG HỌC KỲ
    // ==========================================
    dataResult.forEach((semester) => {
      // Dòng tiêu đề Học kỳ
      worksheet.mergeCells(`A${currentRow}:P` + currentRow); // Merge sang cột P
      const semCell = worksheet.getCell(`A${currentRow}`);
      semCell.value = `${semester.semesterName.toUpperCase()} (NĂM HỌC: ${semester.schoolYear})`;
      semCell.font = {
        name: "Arial",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      semCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF366092" },
      };
      semCell.alignment = { vertical: "middle", indent: 1 };
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // Header của Table Điểm (Tách rõ ràng toàn bộ các cột điểm)
      const headers = [
        "STT",
        "Mã môn",
        "Tên môn học",
        "Số TC",
        "KTTX 1",
        "KTTX 2",
        "KTTX 3",
        "KTĐK 1",
        "KTĐK 2",
        "KTĐK 3",
        "KTĐK 4",
        "Điểm TB",
        "Tổng kết 1",
        "Tổng kết 2",
        "Đánh giá",
        "Ghi chú",
      ];
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = headers;
      headerRow.height = 22;

      // Style cho Header Table (Chạy đến cột 16 tương đương với P)
      for (let col = 1; col <= 16; col++) {
        const cell = headerRow.getCell(col);
        cell.font = { name: "Arial", size: 10, bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE9EDF4" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }
      currentRow++;

      // Điền danh sách môn học và điểm số chi tiết
      semester.grades.forEach((grade, index) => {
        const rowData = [
          index + 1,
          grade.subjectCode,
          grade.subjectName,
          grade.credits,
          grade.kttx1,
          grade.kttx2,
          grade.kttx3,
          grade.ktdk1,
          grade.ktdk2,
          grade.ktdk3,
          grade.ktdk4,
          grade.diemTB,
          grade.diemTongKet1,
          grade.diemTongKet2,
          grade.rating,
          grade.note,
        ];

        const row = worksheet.getRow(currentRow);
        row.values = rowData;
        row.height = 20;

        // Căn chỉnh vị trí chữ và thêm border cho 16 cột dữ liệu
        for (let col = 1; col <= 16; col++) {
          const cell = row.getCell(col);
          cell.font = { name: "Arial", size: 10 };
          cell.border = {
            top: { style: "thin", color: { argb: "FFD9D9D9" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
          };

          // Định dạng căn lề: Tên môn học (3) và Ghi chú (16) căn trái, còn lại căn giữa
          if (col === 3 || col === 16) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
        }
        currentRow++;
      });

      // Tạo một dòng trống nhỏ giữa các học kỳ
      currentRow += 1;
    });

    // Xuất workbook ra Buffer
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
  }
}
