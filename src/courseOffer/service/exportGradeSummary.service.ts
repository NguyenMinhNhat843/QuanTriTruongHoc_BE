import { Injectable, NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../../prisma/prisma.service";
import { getSemestersByBatch } from "../../utils/academic.util";
import { ExportGradeTableService } from "./exportGrades.service";

@Injectable()
export class ExportGradeTableSummaryService {
  constructor(
    private prisma: PrismaService,
    private exportGradeService: ExportGradeTableService,
  ) {}

  // =========================================================================
  // BỘ STYLE CHUẨN GIÁO DỤC THỐNG NHẤT
  // =========================================================================
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
    color: { argb: "FF1F497D" },
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

  // =========================================================================
  // CÁC HÀM HELPER CONVERT ĐIỂM
  // =========================================================================
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

  private convertDiem4ToXepLoai(diemHe4: number): string {
    if (diemHe4 >= 3.5) return "Xuất sắc";
    if (diemHe4 >= 3.0) return "Giỏi";
    if (diemHe4 >= 2.5) return "Khá";
    if (diemHe4 >= 2.0) return "Trung bình";
    return "Yếu";
  }

  // =========================================================================
  // HELPER DỰNG CẤU TRÚC GIAO DIỆN EXCEL DÙNG CHUNG
  // =========================================================================
  private drawHeader(
    sheet: ExcelJS.Worksheet,
    title: string,
    metaRight: string,
    subjects: { name: string }[],
  ) {
    // 1. Tiêu đề lớn dòng 1
    sheet.mergeCells("A1:J1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = this.TITLE_FONT;
    titleCell.alignment = this.CENTER_ALIGNMENT;
    sheet.getRow(1).height = 30;

    // 2. Thông tin góc phải dòng 2
    if (metaRight) {
      sheet.mergeCells("H2:J2");
      const metaCell = sheet.getCell("H2");
      metaCell.value = metaRight;
      metaCell.font = this.BOLD_FONT;
      metaCell.alignment = { vertical: "middle", horizontal: "right" };
    }

    // 3. Cài đặt độ rộng cột cơ bản (A -> J)
    const baseWidths = [6, 15, 25, 12, 12, 12, 10, 12, 12, 12];
    baseWidths.forEach((w, idx) => {
      sheet.getColumn(idx + 1).width = w;
    });

    // 4. Header Table dòng 3 & dòng 4
    const baseHeaders = [
      { cell: "A3", merge: "A3:A4", val: "STT" },
      { cell: "B3", merge: "B3:B4", val: "Ngày sinh" },
      { cell: "C3", merge: "C3:C4", val: "Họ và tên học sinh" },
      { cell: "D3", merge: "D3:D4", val: "Điểm TB\n(Hệ 10)" },
      { cell: "E3", merge: "E3:E4", val: "Điểm TB\n(Hệ 4)" },
      { cell: "F3", merge: "F3:F4", val: "Điểm\nchữ" },
      { cell: "G3", merge: "G3:G4", val: "Xếp\nloại HL" },
      { cell: "H3", merge: "H3:H4", val: "Xếp\nloại RL" },
      { cell: "I3", merge: "I3:I4", val: "Điểm\nRL" },
      { cell: "J3", merge: "J3:J4", val: "Ghi\nchú" },
    ];
    baseHeaders.forEach((h) => {
      sheet.mergeCells(h.merge);
      sheet.getCell(h.cell).value = h.val;
    });

    // 5. Thêm các cột môn học động (Từ cột K trở đi)
    const startSubjectCol = 11;
    if (subjects.length > 0) {
      const startLetter = sheet.getColumn(startSubjectCol).letter;
      const endLetter = sheet.getColumn(
        startSubjectCol + subjects.length * 2 - 1,
      ).letter;
      sheet.mergeCells(`${startLetter}3:${endLetter}3`);
      const mainSubCell = sheet.getCell(`${startLetter}3`);
      mainSubCell.value = "DANH SÁCH MÔN HỌC / MÔ ĐUN";
      mainSubCell.font = this.BOLD_FONT;
      mainSubCell.alignment = this.CENTER_ALIGNMENT;

      subjects.forEach((sub, index) => {
        const colIdx = startSubjectCol + index * 2;
        sheet.getColumn(colIdx).width = 14;
        sheet.getColumn(colIdx + 1).width = 6;

        const cellStart = sheet.getColumn(colIdx).letter + "4";
        const cellEnd = sheet.getColumn(colIdx + 1).letter + "4";
        sheet.mergeCells(`${cellStart}:${cellEnd}`);

        const subCell = sheet.getCell(cellStart);
        subCell.value = sub.name;
        subCell.font = this.BOLD_FONT;
        subCell.alignment = this.CENTER_ALIGNMENT;
      });
    }

    // 6. Đổ style background cho toàn bộ Header khối Table (Dòng 3 & Dòng 4)
    const totalCols = 10 + subjects.length * 2;
    for (let r = 3; r <= 4; r++) {
      sheet.getRow(r).height = 24;
      for (let c = 1; c <= totalCols; c++) {
        const cell = sheet.getCell(r, c);
        cell.font = this.BOLD_FONT;
        cell.alignment = this.CENTER_ALIGNMENT;
        cell.border = this.CELL_BORDER;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" },
        };
      }
    }
  }

  private styleDataRow(row: ExcelJS.Row, totalCols: number) {
    row.height = 22;
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.font = this.DEFAULT_FONT;
      cell.border = this.CELL_BORDER;
      if (c === 3) {
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
      } else {
        cell.alignment = this.CENTER_ALIGNMENT;
      }
    }
  }

  // =========================================================================
  // CORE LOGIC: XÂY DỰNG DATA VÀ VẼ SHEET TỔNG HỢP (CHO KỲ / NĂM / TOÀN KHÓA)
  // =========================================================================
  private buildDynamicSummarySheet(
    sheet: ExcelJS.Worksheet,
    sheetTitle: string,
    metaRight: string,
    courseOfferIds: number[],
    studentsList: any[],
    rawGradeMap: Map<number, Map<number, any>>, // Đổi kiểu dữ liệu Key Map sang number đồng nhất
  ) {
    // 1. Lấy danh sách thông tin môn học tương ứng trong tập cấu hình ids này
    const currentSubjects =
      studentsList[0]?.grades
        ?.filter((g: any) => courseOfferIds.includes(g.courseOfferId))
        .map((g: any) => ({
          id: g.courseOfferId,
          name: g.subjectName,
          credits: g.credits,
        })) || [];

    // Loại bỏ các môn trùng lặp nếu có
    const uniqueSubjects: any = Array.from(
      new Map(currentSubjects.map((s: any) => [s.id, s])).values(),
    );

    // 2. Vẽ giao diện Header
    this.drawHeader(sheet, sheetTitle, metaRight, uniqueSubjects);

    // 3. Tính toán và chèn dữ liệu học sinh
    studentsList.forEach((student, index) => {
      let totalWeightedScore10 = 0;
      let totalWeightedScore4 = 0;
      let totalCredits = 0;
      const rowDataScores: any[] = [];

      uniqueSubjects.forEach((sub: any) => {
        const studentGrades = rawGradeMap.get(student.id);
        const gradeObj = studentGrades?.get(sub.id);

        const rawScore = gradeObj?.diemTongKet2 ?? gradeObj?.diemTongKet1;

        if (rawScore !== null && rawScore !== undefined && rawScore !== "") {
          const score10 = Number(rawScore);
          const gradeLetter = this.convertHe10ToDiemChu(score10);
          const score4 = this.convertDiemChuToHe4(gradeLetter);

          totalWeightedScore10 += score10 * sub.credits;
          totalWeightedScore4 += score4 * sub.credits;
          totalCredits += sub.credits;

          rowDataScores.push(score10, gradeLetter);
        } else {
          rowDataScores.push("", "");
        }
      });

      const gpa10 =
        totalCredits > 0
          ? Math.round((totalWeightedScore10 / totalCredits) * 10) / 10
          : 0;
      const gpa4 =
        totalCredits > 0
          ? Math.round((totalWeightedScore4 / totalCredits) * 100) / 100
          : 0;
      const finalLetter = this.convertHe10ToDiemChu(gpa10);
      const xepLoaiHL = this.convertDiem4ToXepLoai(gpa4);

      // Chèn hàng vào excel
      const currentRowNum = 5 + index;
      const row = sheet.getRow(currentRowNum);

      row.getCell(1).value = index + 1;
      row.getCell(2).value = student.dob; // Đổ giá trị ngày sinh (dob) đã thay đổi
      row.getCell(3).value = student.fullName;
      row.getCell(4).value = totalCredits > 0 ? gpa10 : "";
      row.getCell(4).numFmt = "0.0";
      row.getCell(5).value = totalCredits > 0 ? gpa4 : "";
      row.getCell(5).numFmt = "0.00";
      row.getCell(6).value = totalCredits > 0 ? finalLetter : "";
      row.getCell(7).value = totalCredits > 0 ? xepLoaiHL : "";
      row.getCell(8).value = "";
      row.getCell(9).value = "";
      row.getCell(10).value = "";

      // Đổ điểm các cột môn học động
      rowDataScores.forEach((val, valIdx) => {
        const cell = row.getCell(11 + valIdx);
        cell.value = val;
        if (typeof val === "number" && valIdx % 2 === 0) {
          cell.numFmt = "0.0";
        }
      });

      this.styleDataRow(row, 10 + uniqueSubjects.length * 2);
      row.commit();
    });
  }

  // =========================================================================
  // XUẤT BẢNG ĐIỂM TỔNG HỢP TOÀN DIỆN CHO MỘT LỚP HỌC (NHIỀU SHEET NHƯ YÊU CẦU)
  // =========================================================================
  async exportClassComprehensiveTranscripts(
    classId: number,
    batchId: number,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // 1. Lấy danh sách các học kỳ mà khóa (Batch) này trải qua
    const semesters = await getSemestersByBatch(this.prisma, batchId);
    const validSemesters = semesters.filter((s) => s !== null);

    if (validSemesters.length === 0) {
      throw new NotFoundException(
        "Không tìm thấy cấu hình học kỳ hợp lệ cho lớp học này.",
      );
    }

    // 2. Truy vấn tất cả các lớp môn học (classSubject) thuộc lớp này chạy qua các học kỳ trên
    const classSubject = await this.prisma.courseOffer.findMany({
      where: {
        classId: classId,
        semesterId: { in: validSemesters.map((s) => s.id) },
      },
      include: {
        subject: true,
        semester: true,
        gradeStudents: {
          include: {
            student: true,
          },
        },
        baseClass: true,
      },
    });

    if (classSubject.length === 0) {
      throw new NotFoundException(
        "Lớp học này hiện tại chưa có dữ liệu điểm môn học nào.",
      );
    }

    // 3. Xây dựng cấu trúc Map dùng ID dạng Number làm khóa chính đồng nhất
    const rawGradeMap = new Map<number, Map<number, any>>();
    const studentsMasterMap = new Map<
      number,
      { id: number; fullName: string; dob: string; grades: any[] }
    >();

    classSubject.forEach((cs) => {
      cs.gradeStudents.forEach((gs) => {
        if (!gs.student) return;
        const studentId = gs.student.id; // Giữ nguyên kiểu dữ liệu gốc (Number)

        // FIX LỖI: Thêm `id` vào trong object Master Info để hàm vẽ có thể lấy ra sử dụng
        if (!studentsMasterMap.has(studentId)) {
          studentsMasterMap.set(studentId, {
            id: studentId,
            fullName: gs.student.fullName || "",
            dob: gs.student.dob
              ? new Date(gs.student.dob).toLocaleDateString("vi-VN")
              : "",
            // format định dạng dd/mm/yyyy hiển thị trên excel cho đẹp mắt
            grades: [],
          });
        }
        studentsMasterMap.get(studentId)!.grades.push({
          courseOfferId: cs.id,
          semesterId: cs.semesterId,
          term: cs.semester.term,
          subjectName: cs.subject.subjectName,
          credits: cs.subject.credits,
        });

        // Cập nhật bảng điểm chi tiết mapping theo cấu trúc chuẩn số
        if (!rawGradeMap.has(studentId)) {
          rawGradeMap.set(studentId, new Map());
        }
        rawGradeMap.get(studentId)!.set(cs.id, gs);
      });
    });

    // Sắp xếp danh sách học sinh theo bảng chữ cái chuẩn Tiếng Việt
    const sortedStudents = Array.from(studentsMasterMap.values()).sort(
      (a, b) => {
        const getLastName = (name: string) => {
          const p = name.trim().split(/\s+/);
          return p[p.length - 1] || "";
        };
        const cmp = getLastName(a.fullName).localeCompare(
          getLastName(b.fullName),
          "vi",
        );
        return cmp !== 0 ? cmp : a.fullName.localeCompare(b.fullName, "vi");
      },
    );

    // 4. Phân nhóm các CourseOfferId theo cấu trúc thời gian của hệ thống
    const sortedSemesters = [...validSemesters].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.term - b.term,
    );

    const coIdsBySemester: Record<number, number[]> = {};
    sortedSemesters.forEach((sem, idx) => {
      coIdsBySemester[idx + 1] = classSubject
        .filter((cs) => cs.semesterId === sem.id)
        .map((cs) => cs.id);
    });

    const coIdsYear1 = [
      ...(coIdsBySemester[1] || []),
      ...(coIdsBySemester[2] || []),
    ];
    const coIdsYear2 = [
      ...(coIdsBySemester[3] || []),
      ...(coIdsBySemester[4] || []),
    ];
    const coIdsAllKhoa = classSubject.map((cs) => cs.id);

    // 5. TIẾN HÀNH GENERATE CÁC SHEET THEO ĐÚNG THỨ TỰ YÊU CẦU
    const className = classSubject[0]?.baseClass?.className || "Lớp";

    // --- Sheet Học Kỳ 1 ---
    if ((coIdsBySemester[1] || []).length > 0) {
      this.buildDynamicSummarySheet(
        workbook.addWorksheet("Bảng điểm HK1"),
        "BẢNG ĐIỂM TỔNG HỢP HỌC KỲ I",
        `Lớp: ${className}`,
        coIdsBySemester[1],
        sortedStudents,
        rawGradeMap,
      );
    }

    // --- Sheet Học Kỳ 2 ---
    if ((coIdsBySemester[2] || []).length > 0) {
      this.buildDynamicSummarySheet(
        workbook.addWorksheet("Bảng điểm HK2"),
        "BẢNG ĐIỂM TỔNG HỢP HỌC KỲ II",
        `Lớp: ${className}`,
        coIdsBySemester[2],
        sortedStudents,
        rawGradeMap,
      );
    }

    // --- Sheet Năm nhất ---
    if (coIdsYear1.length > 0) {
      this.buildDynamicSummarySheet(
        workbook.addWorksheet("Bảng điểm Năm 1"),
        "BẢNG ĐIỂM TỔNG HỢP NĂM THỨ NHẤT",
        `Lớp: ${className}`,
        coIdsYear1,
        sortedStudents,
        rawGradeMap,
      );
    }

    // --- Sheet Học Kỳ 3 ---
    if ((coIdsBySemester[3] || []).length > 0) {
      this.buildDynamicSummarySheet(
        workbook.addWorksheet("Bảng điểm HK3"),
        "BẢNG ĐIỂM TỔNG HỢP HỌC KỲ III",
        `Lớp: ${className}`,
        coIdsBySemester[3],
        sortedStudents,
        rawGradeMap,
      );
    }

    // --- Sheet Học Kỳ 4 ---
    if ((coIdsBySemester[4] || []).length > 0) {
      this.buildDynamicSummarySheet(
        workbook.addWorksheet("Bảng điểm HK4"),
        "BẢNG ĐIỂM TỔNG HỢP HỌC KỲ IV",
        `Lớp: ${className}`,
        coIdsBySemester[4],
        sortedStudents,
        rawGradeMap,
      );
    }

    // --- Sheet Năm hai ---
    if (coIdsYear2.length > 0) {
      this.buildDynamicSummarySheet(
        workbook.addWorksheet("Bảng điểm Năm 2"),
        "BẢNG ĐIỂM TỔNG HỢP NĂM THỨ HAI",
        `Lớp: ${className}`,
        coIdsYear2,
        sortedStudents,
        rawGradeMap,
      );
    }

    // --- Sheet Toàn Khóa ---
    this.buildDynamicSummarySheet(
      workbook.addWorksheet("Bảng điểm Toàn khóa"),
      "BẢNG ĐIỂM TỔNG HỢP TOÀN KHÓA HỌC",
      `Lớp: ${className}`,
      coIdsAllKhoa,
      sortedStudents,
      rawGradeMap,
    );

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
