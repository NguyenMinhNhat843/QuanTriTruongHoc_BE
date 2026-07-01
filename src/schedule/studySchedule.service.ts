import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateStudyScheduleDto,
  ExportStudyScheduleDto,
  SearchStudyScheduleDto,
} from "./studySchedule.dto";
import * as ExcelJS from "exceljs";
import moment from "moment";

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hàm tạo lịch học cho 1 lớp, 1 học kỳ
   */
  async generateScheduleForAClass(data: CreateStudyScheduleDto[]) {
    const formattedData = data.map((item) => ({
      ...item,
      studyDate: item.studyDate ? new Date(item.studyDate) : null,
    }));

    await this.prisma.classSubjectSchedule.createMany({
      data: formattedData,
      skipDuplicates: true,
    });

    return {
      message: "Tạo tiến độ đào tạo thành công",
    };
  }

  /**
   * Xuất excel tiến độ đào tạo của 1 lớp trong 1 học kỳ
   */
  async exportStudyScheduleToExcel(
    query: ExportStudyScheduleDto,
  ): Promise<Buffer> {
    const { classId, semesterId } = query;

    // 1. Lấy thông tin Lớp học và Học kỳ trước để kiểm tra thông tin & lấy số tuần dạy
    const [currentClass, semester] = await Promise.all([
      this.prisma.class.findUnique({ where: { id: classId } }),
      this.prisma.semester.findUnique({ where: { id: semesterId } }),
    ]);

    if (!currentClass) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${classId}`);
    }
    if (!semester) {
      throw new NotFoundException(`Không tìm thấy học kỳ với ID ${semesterId}`);
    }

    const maxWeeks = semester.teachingWeeks || 30; // Mặc định là 30 tuần nếu không nhập cấu hình
    const semStartDate = moment(semester.startDate);

    // 2. Truy vấn toàn bộ lịch học chi tiết thuộc Lớp và Học kỳ yêu cầu
    const schedules = await this.prisma.classSubjectSchedule.findMany({
      where: {
        classSubject: {
          classId: classId,
          semesterId: semesterId,
        },
      },
      include: {
        classSubject: {
          include: {
            subject: true,
            teacher: true,
          },
        },
      },
      orderBy: [
        { classSubjectId: "asc" },
        { dayOfWeek: "asc" },
        { shift: "asc" },
        { startPeriod: "asc" },
        { weekNumber: "asc" },
      ],
    });

    // 3. Xử lý gom nhóm và tính toán số liệu tiến độ
    // Tính tổng số tiết đã xếp cho từng Môn học (gồm tất cả các buổi/ca của môn học đó)
    const totalScheduledPerSubject: Record<number, number> = {};
    schedules.forEach((item) => {
      const subId = item.classSubject.subjectId;
      const count = item.countPeriod || item.endPeriod - item.startPeriod + 1;
      totalScheduledPerSubject[subId] =
        (totalScheduledPerSubject[subId] || 0) + count;
    });

    // Gom nhóm lịch theo "Buổi học" (Tổ hợp duy nhất: môn, thứ, ca, tiết bắt đầu - tiết kết thúc)
    // Mỗi nhóm này sẽ tạo thành 1 dòng trên file Excel
    const groupMap: Record<
      string,
      {
        classSubjectId: number;
        subjectId: number;
        subjectCode: string;
        subjectName: string;
        teacherName: string;
        tietHienThi: string; // Ví dụ: C2-3, S1-4...
        totalSubjectHours: number; // Tổng số tiết môn thiết kế (Lý thuyết + thực hành + kiểm tra)
        totalSubjectScheduled: number; // Tổng số tiết đã xếp của môn trong học kỳ
        sessionTotalHours: number; // Tổng số tiết tích lũy của riêng ca/buổi này qua các tuần
        weeksData: Record<number, number>; // Lưu số tiết của từng tuần: { [weekNumber]: countPeriod }
      }
    > = {};

    schedules.forEach((item) => {
      const cs = item.classSubject;
      const sub = cs.subject;
      const teacher = cs.teacher;

      const tietHienThi = `${item.shift}${item.startPeriod}-${item.endPeriod}`;
      // Key gom nhóm dựa trên ClassSubject và Khung giờ học cố định
      const groupKey = `${item.classSubjectId}_${item.dayOfWeek}_${item.shift}_${item.startPeriod}_${item.endPeriod}`;

      const count = item.countPeriod || item.endPeriod - item.startPeriod + 1;
      const totalHours =
        (sub.theoryHours || 0) +
        (sub.practiceHours || 0) +
        (sub.testHours || 0);

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          classSubjectId: item.classSubjectId,
          subjectId: sub.id,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          teacherName: teacher?.fullName || "Chưa phân công",
          tietHienThi: tietHienThi,
          totalSubjectHours: totalHours,
          totalSubjectScheduled: totalScheduledPerSubject[sub.id] || 0,
          sessionTotalHours: 0,
          weeksData: {},
        };
      }

      groupMap[groupKey].sessionTotalHours += count;
      groupMap[groupKey].weeksData[item.weekNumber] = count;
    });

    // Chuyển object map thành mảng danh sách dòng dữ liệu
    const rowsData = Object.values(groupMap);

    // 4. Khởi tạo và thiết kế giao diện Workbook ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tiến độ đào tạo");

    // Thiết lập cấu hình các cột chính ban đầu
    const columnsConfig: any[] = [
      { header: "STT", key: "stt", width: 6 },
      { header: "TÊN MÔN HỌC", key: "subjectName", width: 25 },
      { header: "GIÁO VIÊN", key: "teacherName", width: 30 },
      { header: "TỔNG GIỜ MÔN", key: "totalHours", width: 22 },
      { header: "TIẾT", key: "period", width: 10 },
    ];

    // Tạo động các cột Tuần dựa vào teachingWeeks cấu hình trong Học kỳ
    for (let w = 1; w <= maxWeeks; w++) {
      // Tính ngày đầu tuần (Thứ 2) cho từng tuần dựa trên ngày bắt đầu của học kỳ
      const weekStartDate = moment(semStartDate).add((w - 1) * 7, "days");
      const formattedDate = weekStartDate.format("DD/MM");

      columnsConfig.push({
        header: `TUẦN ${w}\n${formattedDate}`,
        key: `week_${w}`,
        width: 12,
      });
    }
    worksheet.columns = columnsConfig;

    // Định dạng tiêu đề bảng chính (Dòng 1)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 35;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" }, // Màu xám nhạt tinh tế
      };
      cell.font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: "FF333333" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "medium", color: { argb: "FFD0D0D0" } },
        left: { style: "thin", color: { argb: "FFE0E0E0" } },
        right: { style: "thin", color: { argb: "FFE0E0E0" } },
      };
    });

    // Điền dữ liệu vào bảng
    let sttCounter = 0;
    let lastSubjectId: number | null = null;
    let mergeStartRow = 2;

    rowsData.forEach((rowData, index) => {
      const currentRowIndex = index + 2; // Dòng dữ liệu bắt đầu từ dòng số 2
      const isSameSubject = rowData.subjectId === lastSubjectId;

      if (!isSameSubject) {
        sttCounter++;
        lastSubjectId = rowData.subjectId;
      }

      // Xây dựng chuỗi văn bản chi tiết tiến độ ở cột số 3
      // Mẫu hiển thị giống ảnh: "20 / 30 tiết\nBuổi này: 8t"
      const currentProgressStr = `${rowData.totalSubjectScheduled} / ${rowData.totalSubjectHours} tiết\nBuổi này: ${rowData.sessionTotalHours}t`;

      // Tạo cấu trúc dữ liệu cho một hàng Excel
      const rowValues: any = {
        stt: isSameSubject ? "" : sttCounter,
        subjectName: `${rowData.subjectName}`,
        teacherName: `${rowData.teacherName}`,
        totalHours: currentProgressStr,
        period: rowData.tietHienThi,
      };

      // Điền số tiết vào từng cột tuần tương ứng (Nếu không học thì điền "-")
      for (let w = 1; w <= maxWeeks; w++) {
        const periodCount = rowData.weeksData[w];
        rowValues[`week_${w}`] = periodCount !== undefined ? periodCount : "-";
      }

      const row = worksheet.addRow(rowValues);
      row.height = 42; // Tăng chiều cao để hiển thị text xuống dòng gọn gàng

      // Cấu hình định dạng chi tiết cho từng ô dữ liệu (Styles & Alignment)
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: "Arial", size: 10, color: { argb: "FF444444" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFEFEFEF" } },
          bottom: { style: "thin", color: { argb: "FFEFEFEF" } },
          left: { style: "thin", color: { argb: "FFEFEFEF" } },
          right: { style: "thin", color: { argb: "FFEFEFEF" } },
        };

        // Cột STT, TIẾT, và các cột TUẦN căn giữa
        if (colNumber === 1 || colNumber === 5 || colNumber >= 6) {
          cell.alignment = { vertical: "middle", horizontal: "center" };
        }
        // Cột TÊN MÔN HỌC căn trái thụt lề nhẹ
        else if (colNumber === 2 || colNumber === 3) {
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
            indent: 1,
          };
        }
        // Cột TỔNG GIỜ MÔN căn giữa và định dạng màu sắc nhãn giống UI mẫu
        else if (colNumber === 4) {
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          cell.font = {
            name: "Arial",
            size: 9,
            bold: true,
            color: { argb: "FFFF9800" },
          }; // Chữ cam nổi bật
        }

        // Đánh dấu các ô tuần không có lịch ("-") bằng font màu xám nhạt
        if (colNumber >= 6 && cell.value === "-") {
          cell.font = { name: "Arial", size: 10, color: { argb: "FFB0B0B0" } };
        }
      });

      // Xử lý Merge ô đối với các môn học xuất hiện nhiều dòng (nhiều ca/buổi)
      if (index > 0) {
        const prevRowData = rowsData[index - 1];
        if (rowData.subjectId !== prevRowData.subjectId) {
          // Khi đổi sang môn học mới, thực hiện merge các dòng của môn trước đó
          if (mergeStartRow < currentRowIndex - 1) {
            worksheet.mergeCells(`A${mergeStartRow}:A${currentRowIndex - 1}`);
            worksheet.mergeCells(`B${mergeStartRow}:B${currentRowIndex - 1}`);
          }
          mergeStartRow = currentRowIndex;
        }
      }

      // Đảm bảo dòng cuối cùng của bảng cũng được thực hiện merge nếu hợp lệ
      if (index === rowsData.length - 1) {
        if (mergeStartRow < currentRowIndex) {
          worksheet.mergeCells(`A${mergeStartRow}:A${currentRowIndex}`);
          worksheet.mergeCells(`B${mergeStartRow}:B${currentRowIndex}`);
        }
      }
    });

    // Thêm đường kẻ viền đậm cho phần cuối của bảng dữ liệu
    const lastRow = worksheet.getRow(worksheet.rowCount);
    lastRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        ...cell.border,
        bottom: { style: "medium", color: { argb: "FF888888" } },
      };
    });

    // 5. Kết xuất workbook thành bộ nhớ đệm Buffer để trả về client tải file
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  /**
   * Load study schedule của 1 lớp trong 1 kỳ
   */
  async loadStudySchedule(query: SearchStudyScheduleDto) {
    const { classId, semesterId, teacherId } = query;

    return this.prisma.classSubjectSchedule.findMany({
      where: {
        classSubject: {
          classId: classId ? Number(classId) : undefined,
          semesterId: semesterId ? Number(semesterId) : undefined,
          teacherId: teacherId ? Number(teacherId) : undefined,
        },
      },
      include: {
        classSubject: {
          select: {
            id: true,
            teacher: {
              select: {
                fullName: true,
                id: true,
              },
            },
            subject: {
              select: {
                subjectName: true,
                subjectCode: true,
                id: true,
              },
            },
            baseClass: {
              select: {
                id: true,
                className: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            roomCode: true,
          },
        },
      },
    });
  }
}
