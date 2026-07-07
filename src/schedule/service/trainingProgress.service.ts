import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { resolveCurriculumSemesterNumber } from "../../utils/academic.util";
import {
  ResponseTrainingProgress,
  UpsertTrainingPlanDto,
} from "../dto/training-progress.dto";
import { plainToInstance } from "class-transformer";
import * as ExcelJS from "exceljs";
import { Response } from "express";

@Injectable()
export class TrainingPlanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. HÀM LẤY KẾ HOẠCH ĐÀO TẠO (Lấy Subject trong CTK làm gốc)
   */
  async getTrainingPlan(classId: number, semesterId: number) {
    // 1. Xác định học kỳ khung hiện tại của lớp là kỳ mấy (Ví dụ: kỳ 1, kỳ 2, kỳ 3...)
    const semesterNumber = await resolveCurriculumSemesterNumber({
      prisma: this.prisma,
      classId: classId,
      semesterId: semesterId,
    });

    // 2. Tìm Chương trình khung gắn với lớp này thông qua Batch
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        batch: {
          select: { curriculumId: true },
        },
      },
    });

    if (!classInfo?.batch?.curriculumId) {
      throw new BadRequestException(
        "Lớp học hoặc Khóa học chưa được cấu hình Chương trình khung.",
      );
    }

    // 3. Lấy tất cả môn học thuộc kỳ khung này trong Chương trình khung
    const curriculumSubjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: classInfo.batch.curriculumId,
        semesterNumber: semesterNumber,
      },
      include: {
        subject: true,
      },
    });

    // 4. Lấy tất cả các kế hoạch (ClassSubject) thực tế ĐÃ TẠO của lớp trong học kỳ này
    const existingClasSubject = await this.prisma.courseOffer.findMany({
      where: {
        classId: classId,
        semesterId: semesterId,
      },
      include: {
        teacher: true, // Thông tin giáo viên
        classSubjectSessions: {
          include: {
            schedules: {
              orderBy: { weekNumber: "asc" },
            },
            room: true,
          },
        },

        subject: true,
      },
    });
    let subjects = existingClasSubject.map(
      (classSubject) => classSubject.subject,
    );
    if (!subjects || subjects.length === 0) {
      subjects = curriculumSubjects.map((cs) => cs.subject);
    }

    // 5. Trộn dữ liệu (Map): Môn nào chưa có CourseOffer thì trả về null/rỗng
    const trainingPlan = subjects.map((subject) => {
      // Tìm xem môn này đã được kích hoạt lập lịch chưa
      const classSubject = existingClasSubject.find(
        (cs) => cs.subjectId === subject.id,
      );

      return {
        classSubject: classSubject || null,
        subject: subject,
        teacher: classSubject?.teacher || null,
        classSubjectSessions: classSubject?.classSubjectSessions || [],
      };
    });

    return plainToInstance(ResponseTrainingProgress, trainingPlan);
  }

  /**
   * 2. HÀM UPSERT KẾ HOẠCH ĐÀO TẠO (Tạo/Cập nhật CourseOffer trước rồi tạo lịch)
   */
  async upsertTrainingPlan(dto: UpsertTrainingPlanDto) {
    const { classId, semesterId, items } = dto;

    return await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { sessions, subjectId, teacherId } = item;

        // Tìm xem đã có môn học này trong lớp/học kỳ này chưa
        const classSubject = await tx.courseOffer.findFirst({
          where: {
            classId,
            semesterId,
            subjectId,
          },
        });

        let currentClassSubjectId: number;

        if (!classSubject) {
          // TRƯỜNG HỢP 1: TẠO MỚI CourseOffer
          const newClassSubject = await tx.courseOffer.create({
            data: {
              classId,
              semesterId,
              subjectId,
              teacherId: teacherId || null,
            },
          });
          currentClassSubjectId = newClassSubject.id;
        } else {
          // TRƯỜNG HỢP 2: CẬP NHẬT ClassSubject
          await tx.courseOffer.update({
            where: { id: classSubject.id },
            data: {
              teacherId: teacherId || null,
            },
          });
          currentClassSubjectId = classSubject.id;

          // --- XỬ LÝ XÓA DỮ LIỆU CŨ ĐỂ LÀM SẠCH ---
          // Bước 2: Xóa các Sessions (Buổi học) cũ, tự động xóa các chedules bên trong
          await tx.classSubjectSession.deleteMany({
            where: {
              classSubjectId: classSubject.id,
            },
          });
        }

        // =================================================================
        // TIẾN HÀNH TẠO MỚI SESSIONS & SCHEDULES (Dùng chung cho cả Tạo mới và Cập nhật)
        // =================================================================
        for (const session of sessions) {
          const { schedules, ...sessionData } = session;

          // 1. Tạo mới buổi học (Session) và gán mối quan hệ với CourseOffer
          const newSession = await tx.classSubjectSession.create({
            data: {
              ...sessionData,
              classSubjectId: currentClassSubjectId, // Liên kết buổi học với môn học hiện tại
            },
          });

          // 2. Tạo hàng loạt chi tiết lịch học (Schedules) cho buổi học vừa tạo
          if (schedules && schedules.length > 0) {
            await tx.classSubjectScheduleDetail.createMany({
              data: schedules.map((schedule) => ({
                sessionId: newSession.id, // Dùng ID thực tế vừa được sinh ra trong DB
                weekNumber: schedule.weekNumber,
                studyDate: schedule.studyDate
                  ? new Date(schedule.studyDate)
                  : null,
                roomId: schedule.roomId || null,
              })),
            });
          }
        }
      }
    });
  }

  async exportTrainingPlanExcel(
    classId: number,
    semesterId: number,
    res: Response,
  ) {
    // -------------------------------------------------------------
    // 1. LẤY THÔNG TIN HỌC KỲ & SỐ TUẦN (n)
    // -------------------------------------------------------------
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) throw new BadRequestException("Không tìm thấy học kỳ.");

    const totalWeeks = semester.teachingWeeks || 30; // Mặc định 30 tuần nếu chưa cấu hình

    // Lấy tên lớp học để hiển thị header
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    const className = classEntity?.className || "N/A";

    // -------------------------------------------------------------
    // 2. TÁI SỬ DỤNG HOẶC LẤY DATA GIỐNG HÀM GET CỦA BẠN
    // -------------------------------------------------------------

    const semesterNumber = await resolveCurriculumSemesterNumber({
      prisma: this.prisma,
      classId: classId,
      semesterId: semesterId,
    });

    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { batch: { select: { curriculumId: true } } },
    });

    if (!classInfo?.batch?.curriculumId) {
      throw new BadRequestException(
        "Lớp học hoặc Khóa học chưa được cấu hình Chương trình khung.",
      );
    }

    const curriculumSubjects = await this.prisma.curriculumSubject.findMany({
      where: {
        curriculumId: classInfo.batch.curriculumId,
        semesterNumber: semesterNumber,
      },
      include: { subject: true },
    });

    const existingClassSubject = await this.prisma.courseOffer.findMany({
      where: { classId: classId, semesterId: semesterId },
      include: {
        teacher: true,
        classSubjectSessions: {
          include: {
            schedules: { orderBy: { weekNumber: "asc" } },
            room: true,
          },
        },
        subject: true,
      },
    });

    let subjects = existingClassSubject.map((cs) => cs.subject);
    if (!subjects || subjects.length === 0) {
      subjects = curriculumSubjects.map((cs) => cs.subject);
    }

    // -------------------------------------------------------------
    // 3. KHỞI TẠO FILE EXCEL VÀ CONFIG LAYOUT
    // -------------------------------------------------------------
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tien_Do_Dao_Tao");

    // Cấu hình font chung & căn lề mặc định
    worksheet.views = [{ showGridLines: true }];

    // Dòng 1 & 2: Thông tin Header Lớp / Học kỳ
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `TIẾN ĐỘ ĐÀO TẠO - LỚP: ${className.toUpperCase()}`;
    titleCell.font = { bold: true, size: 14, name: "Arial" };
    titleCell.alignment = { horizontal: "left" };

    worksheet.mergeCells("A2:G2");
    const subTitleCell = worksheet.getCell("A2");
    subTitleCell.value = `Học kỳ: ${semester.name || "N/A"})`;
    subTitleCell.font = { italic: true, size: 11, name: "Arial" };
    subTitleCell.alignment = { horizontal: "left" };

    // Dòng 4: Định nghĩa Header của Bảng
    const baseHeaders = [
      "STT",
      "TÊN MÔN HỌC",
      "GIÁO VIÊN GIẢNG DẠY",
      "TỔNG SỐ TIẾT",
      "PHÒNG",
      "THỨ",
      "TIẾT",
    ];
    const weekHeaders = Array.from(
      { length: totalWeeks },
      (_, i) => `TUẦN ${i + 1}`,
    );
    const allHeaders = [...baseHeaders, ...weekHeaders];

    worksheet.getRow(4).values = allHeaders;

    // Style dòng Header (Dòng số 4)
    const headerRow = worksheet.getRow(4);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFF" },
        size: 10,
        name: "Arial",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "3F51B5" },
      }; // Màu xanh Indigo đồng bộ UI
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // -------------------------------------------------------------
    // 4. ĐỔ DỮ LIỆU VÀO CÁC DÒNG (ROW-BY-ROW) VÀ GỘP Ô
    // -------------------------------------------------------------
    let currentRowIndex = 5; // Bắt đầu ghi từ dòng 5 do 4 dòng đầu làm header

    subjects.forEach((subject, index) => {
      const classSubject = existingClassSubject.find(
        (cs) => cs.subjectId === subject.id,
      );
      const sessions = classSubject?.classSubjectSessions || [];

      // Tổng số tiết (Lấy từ curriculum hoặc định nghĩa sẵn, tạm để 0 nếu trống)
      const totalPeriods = 0;
      const teacherName = classSubject?.teacher?.fullName || "Chưa phân công";
      const stt = index + 1;

      // Xác định số dòng cần render cho môn này (Ít nhất là 1 dòng nếu chưa lập lịch)
      const rowSpan = sessions.length > 0 ? sessions.length : 1;

      for (let i = 0; i < rowSpan; i++) {
        const session = sessions[i];
        const rowData: any = [];

        // Ghi dữ liệu cơ bản cho dòng hiện tại
        rowData[1] = stt;
        rowData[2] = subject.subjectName;
        rowData[3] = teacherName;
        rowData[4] = totalPeriods;

        if (session) {
          rowData[5] = session.room?.roomCode || "Chọn phòng...";
          rowData[6] = `Thứ ${session.dayOfWeek}`;
          rowData[7] = `${session.shift}${session.startPeriod}-${session.endPeriod}`;

          // Điền số tiết vào các cột tuần tương ứng
          for (let w = 1; w <= totalWeeks; w++) {
            const hasSchedule = session.schedules.some(
              (s) => s.weekNumber === w,
            );
            // Cột tuần bắt đầu từ vị trí thứ 8 (Index 8 trong mảng rowData tương đương cột H)
            rowData[7 + w] = hasSchedule
              ? session.countPeriod ||
                session.endPeriod - session.startPeriod + 1
              : "";
          }
        } else {
          rowData[5] = "Chưa chọn";
          rowData[6] = "Chưa chọn";
          rowData[7] = "";
          for (let w = 1; w <= totalWeeks; w++) rowData[7 + w] = "";
        }

        // Đưa rowData vào worksheet
        const row = worksheet.getRow(currentRowIndex);
        row.values = rowData;
        row.height = 22;

        // Định dạng viền và căn lề cho dòng dữ liệu này
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { size: 10, name: "Arial" };
          cell.border = {
            top: { style: "thin", color: { argb: "E0E0E0" } },
            left: { style: "thin", color: { argb: "E0E0E0" } },
            bottom: { style: "thin", color: { argb: "E0E0E0" } },
            right: { style: "thin", color: { argb: "E0E0E0" } },
          };

          // Căn lề số cho STT, Tiết, Tuần và căn trái cho Tên môn học
          if ([1, 4, 6, 7].includes(colNumber) || colNumber > 7) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        });

        currentRowIndex++;
      }

      // Thực hiện GỘP DÒNG (Merge) cho môn học có nhiều buổi học
      if (rowSpan > 1) {
        const startMergeRow = currentRowIndex - rowSpan;
        const endMergeRow = currentRowIndex - 1;

        worksheet.mergeCells(`A${startMergeRow}:A${endMergeRow}`); // STT
        worksheet.mergeCells(`B${startMergeRow}:B${endMergeRow}`); // Tên môn học
        worksheet.mergeCells(`C${startMergeRow}:C${endMergeRow}`); // Giáo viên
        worksheet.mergeCells(`D${startMergeRow}:D${endMergeRow}`); // Tổng số tiết
      }
    });

    // -------------------------------------------------------------
    // 5. AUTO-FIT ĐỘ RỘNG CÁC CỘT
    // -------------------------------------------------------------
    worksheet.columns.forEach((column, index) => {
      if (index < 4) {
        column.width = index === 1 ? 30 : 15; // Cho cột Tên môn rộng hơn một chút
      } else if (index >= 4 && index < 7) {
        column.width = 12;
      } else {
        column.width = 8; // Cột các tuần cần hẹp lại để vừa màn hình Excel
      }
    });

    // -------------------------------------------------------------
    // 6. PHẢN HỒI THÔNG TIN FILE VỀ CLIENT
    // -------------------------------------------------------------
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Tien_Do_Dao_Tao_${className}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
