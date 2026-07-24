import { Injectable, NotFoundException } from "@nestjs/common";
import { Response } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import {
  TITLE_FONT,
  BOLD_FONT,
  DEFAULT_FONT,
  CELL_BORDER,
  CENTER_ALIGNMENT,
  LEFT_ALIGNMENT,
} from "../../common/constant/excel-style.constant";
import * as ExcelJS from "exceljs";
import { ExcelHelper } from "../../common/helpers/excels.helper";

@Injectable()
export class ExportExcelService {
  constructor(private prisma: PrismaService) {}

  async exportBangDiemRenLuyenHocKy(classId: number, semesterId: number, res: Response) {
    // 1. Tối ưu hóa truy vấn thông tin chung (Parallel Queries)
    const [classInfo, semesterInfo] = await Promise.all([
      this.prisma.class.findUnique({
        where: { id: classId },
        include: { batch: true, major: true },
      }),
      this.prisma.semester.findUnique({
        where: { id: semesterId },
      }),
    ]);

    if (!classInfo) throw new NotFoundException("Không tìm thấy thông tin lớp học.");
    if (!semesterInfo) throw new NotFoundException("Không tìm thấy thông tin học kỳ.");

    // 2. Lấy danh sách học sinh kèm thông tin điểm và đánh giá bằng 1 truy vấn SQL duy nhất (Tránh N+1 query)
    const students = await this.prisma.student.findMany({
      where: { classId },
      orderBy: { studentCode: "asc" },
      include: {
        gradeStudents: {
          where: { classSubject: { semesterId } },
          include: { classSubject: { include: { subject: true } } },
        },
        assessments: {
          where: { period: { semesterId } },
          take: 1,
        },
      },
    });

    // 3. Khởi tạo Helper và cấu hình Sheet dữ liệu
    const excel = new ExcelHelper();
    excel.addSheet("Điểm rèn luyện");

    // 4. Dựng khối tiêu đề văn bản (Rows 1 -> 3)
    excel.writeCell("A1", "TỔNG HỢP ĐIỂM RÈN LUYỆN HỌC KỲ", {
      font: TITLE_FONT,
      align: CENTER_ALIGNMENT,
      mergeTo: "K1",
    });
    excel.currentSheet.getRow(1).height = 35;

    excel.writeCell("A2", `Lớp: ${classInfo.className}`, { font: BOLD_FONT });
    excel.writeCell("A3", `Khóa: ${classInfo.batch?.batchName || ""}`, {
      font: BOLD_FONT,
    });
    excel.writeCell("E3", `Học kỳ: ${semesterInfo.term || ""}`, {
      font: BOLD_FONT,
      align: CENTER_ALIGNMENT,
    });
    excel.writeCell("I3", `Năm học: ${semesterInfo.schoolYear || ""}`, {
      font: BOLD_FONT,
      align: CENTER_ALIGNMENT,
    });

    // 5. Định hình cấu trúc Headers dạng ma trận phức hợp (Rows 5 & 6)
    const headerConfigs = [
      { cells: "A5:A6", value: "STT" },
      { cells: "B5:B6", value: "Mã học sinh" },
      { cells: "C5:D5", value: "Họ và tên học sinh" },
      { cells: "C6", value: "Họ và đệm" },
      { cells: "D6", value: "Tên" },
      { cells: "E5:E6", value: "Tổng điểm\nHSSV tự\nđánh giá" },
      { cells: "F5:F6", value: "Kết quả học\ntập cuối kỳ\nHSSV" },
      { cells: "G5:G6", value: "Tổng điểm Lớp\nvà GVCN\nđánh giá" },
      { cells: "H5:H6", value: "Kết quả học\ntập cuối kỳ\nGV" },
      { cells: "I5:J5", value: "Kết luận" },
      { cells: "I6", value: "Điểm rèn\nluyện" },
      { cells: "J6", value: "Xếp loại" },
      { cells: "K5:K6", value: "Ghi chú" },
    ];

    excel.createTableHeaders(5, 2, headerConfigs, 11);
    excel.setColumnWidths([6, 14, 22, 10, 16, 16, 16, 16, 14, 14, 12]);

    // 6. Đổ dữ liệu và nhúng công thức Excel tính toán tự động
    const startRow = 7;
    students.forEach((student, index) => {
      const currentRow = startRow + index;
      const row = excel.currentSheet.getRow(currentRow);
      row.height = 22;

      // Xử lý chuỗi tên học sinh an toàn
      const nameParts = student.fullName ? student.fullName.trim().split(/\s+/) : [];
      const lastName = nameParts.pop() || "";
      const firstName = nameParts.join(" ") || "";

      // Tính điểm GPA Học kỳ từ dữ liệu đã nạp sẵn (Eager-loaded)
      let totalCredits = 0;
      let totalWeightedScore = 0;

      student.gradeStudents.forEach((grade) => {
        const credits = grade.classSubject.subject.credits || 0;
        const finalScore = grade.diemTongKet2 ?? grade.diemTongKet1 ?? 0;
        totalCredits += credits;
        totalWeightedScore += finalScore * credits;
      });

      const gpaHocKy = totalCredits > 0 ? Math.round((totalWeightedScore / totalCredits) * 10) / 10 : 0;

      // Trích xuất điểm đánh giá rèn luyện
      const assessment = student.assessments[0];
      const diemTuDanhGia = assessment?.totalStudentScore || 0;
      const diemGvDanhGia = assessment?.totalTeacherScore || 0;
      const diemRenLuyenTongKet = (diemTuDanhGia + gpaHocKy + (diemGvDanhGia + gpaHocKy)) / 2;

      // Chuẩn bị mảng giá trị cho hàng
      const rowValues = [
        index + 1,
        student.studentCode,
        firstName,
        lastName,
        diemTuDanhGia,
        gpaHocKy,
        diemGvDanhGia,
        gpaHocKy,
        diemRenLuyenTongKet,
        {
          formula: `=IF(I${currentRow}>=90,"Xuất sắc",IF(I${currentRow}>=80,"Tốt",IF(I${currentRow}>=70,"Khá",IF(I${currentRow}>=50,"Trung bình","Yếu"))))`,
        },
        "",
      ];

      // Thiết lập Zebra Striping màu siêu nhẹ
      const isEven = index % 2 === 0;
      const rowFill: ExcelJS.Fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFFFFF" : "F9FAFB" },
      };

      // Ghi hàng dữ liệu đồng bộ qua vòng lặp, áp cấu trúc định dạng chuẩn
      rowValues.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = colIdx === 9 ? BOLD_FONT : DEFAULT_FONT; // Chữ in đậm cho cột Xếp loại (Cột J)
        cell.border = CELL_BORDER;
        cell.fill = rowFill;

        // Định dạng căn lề dựa trên mục đích dữ liệu (Cột Họ tên, đệm, ghi chú -> Căn trái)
        cell.alignment = [2, 3, 10].includes(colIdx) ? LEFT_ALIGNMENT : CENTER_ALIGNMENT;

        // Định dạng số thập phân hiển thị cho các cột điểm học tập GPA (Cột F và H)
        if ([5, 7].includes(colIdx) && typeof val === "number") {
          cell.numFmt = "0.0";
        }
      });

      row.commit();
    });

    // 7. Thiết lập Headers và trả luồng file nhị phân về phía Client
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=TongHop_DiemRenLuyen_${classInfo.classCode}.xlsx`);

    const buffer = await excel.toBuffer();
    res.status(200).send(buffer);
  }
}
