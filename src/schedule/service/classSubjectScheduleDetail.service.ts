import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSubjectScheduleDetailDto, UpdateClassSubjectScheduleDetailDto, SearchClassSubjectScheduleDetailDto } from '../dto/classSubjectScheduleDetail';
import * as ExcelJS from 'exceljs';
import moment from 'moment';

@Injectable()
export class ClassSubjectScheduleDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateClassSubjectScheduleDetailDto) {
    return this.prisma.classSubjectScheduleDetail.create({
      data: {
        ...createDto,
        studyDate: createDto.studyDate ? new Date(createDto.studyDate) : null,
      },
    });
  }

  async findAll(query: SearchClassSubjectScheduleDetailDto) {
    return this.prisma.classSubjectScheduleDetail.findMany({
      where: {
        sessionId: query.sessionId ? Number(query.sessionId) : undefined,
        roomId: query.roomId ? Number(query.roomId) : undefined,
        weekNumber: query.weekNumber ? Number(query.weekNumber) : undefined,
        studyDate: query.studyDate ? new Date(query.studyDate) : undefined,
      },
      include: {
        room: true,
        session: {
          include: {
            classSubject: {
              include: {
                subject: true,
                teacher: true,
                baseClass: true,
              }
            }
          }
        }
      }
    });
  }

  async findOne(id: number) {
    const detail = await this.prisma.classSubjectScheduleDetail.findUnique({
      where: { id },
      include: {
        room: true,
        session: {
          include: {
            classSubject: {
              include: {
                subject: true,
                teacher: true,
                baseClass: true,
              }
            }
          }
        }
      }
    });
    if (!detail) {
      throw new NotFoundException(`ClassSubjectScheduleDetail with ID ${id} not found`);
    }
    return detail;
  }

  async update(id: number, updateDto: UpdateClassSubjectScheduleDetailDto) {
    await this.findOne(id);
    return this.prisma.classSubjectScheduleDetail.update({
      where: { id },
      data: {
        ...updateDto,
        studyDate: updateDto.studyDate ? new Date(updateDto.studyDate) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.classSubjectScheduleDetail.delete({
      where: { id },
    });
  }

  /**
   * Load study schedule of a class, teacher, or semester
   */
  async loadStudySchedule(query: { classId?: number; semesterId?: number; teacherId?: number; weekNumber?: number }) {
    const { classId, semesterId, teacherId, weekNumber } = query;
    return this.prisma.classSubjectScheduleDetail.findMany({
      where: {
        weekNumber: weekNumber ? Number(weekNumber) : undefined,
        session: {
          classSubject: {
            classId: classId ? Number(classId) : undefined,
            semesterId: semesterId ? Number(semesterId) : undefined,
            teacherId: teacherId ? Number(teacherId) : undefined,
          }
        }
      },
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
          }
        },
        session: {
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
          },
        },
      },
    });
  }

  /**
   * Export excel study schedule of a class in a semester
   */
  async exportStudyScheduleToExcel(query: { classId: number; semesterId: number }): Promise<Buffer> {
    const { classId, semesterId } = query;

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

    const maxWeeks = semester.teachingWeeks || 30;
    const semStartDate = moment(semester.startDate);

    const schedules = await this.prisma.classSubjectScheduleDetail.findMany({
      where: {
        session: {
          classSubject: {
            classId: classId,
            semesterId: semesterId,
          },
        },
      },
      include: {
        session: {
          include: {
            classSubject: {
              include: {
                subject: true,
                teacher: true,
              },
            },
          },
        },
      },
    });

    // Sort in memory to avoid nested ordering issues
    schedules.sort((a, b) => {
      if (a.session.classSubjectId !== b.session.classSubjectId) {
        return a.session.classSubjectId - b.session.classSubjectId;
      }
      if (a.session.dayOfWeek !== b.session.dayOfWeek) {
        return a.session.dayOfWeek.localeCompare(b.session.dayOfWeek);
      }
      if (a.session.shift !== b.session.shift) {
        return a.session.shift.localeCompare(b.session.shift);
      }
      if (a.session.startPeriod !== b.session.startPeriod) {
        return a.session.startPeriod - b.session.startPeriod;
      }
      return a.weekNumber - b.weekNumber;
    });

    const totalScheduledPerSubject: Record<number, number> = {};
    schedules.forEach((item) => {
      const subId = item.session.classSubject.subjectId;
      const count = item.session.countPeriod || item.session.endPeriod - item.session.startPeriod + 1;
      totalScheduledPerSubject[subId] = (totalScheduledPerSubject[subId] || 0) + count;
    });

    const groupMap: Record<
      string,
      {
        classSubjectId: number;
        subjectId: number;
        subjectCode: string;
        subjectName: string;
        teacherName: string;
        tietHienThi: string;
        totalSubjectHours: number;
        totalSubjectScheduled: number;
        sessionTotalHours: number;
        weeksData: Record<number, number>;
      }
    > = {};

    schedules.forEach((item) => {
      const cs = item.session.classSubject;
      const sub = cs.subject;
      const teacher = cs.teacher;

      const tietHienThi = `${item.session.shift}${item.session.startPeriod}-${item.session.endPeriod}`;
      const groupKey = `${item.session.classSubjectId}_${item.session.dayOfWeek}_${item.session.shift}_${item.session.startPeriod}_${item.session.endPeriod}`;

      const count = item.session.countPeriod || item.session.endPeriod - item.session.startPeriod + 1;
      const totalHours = (sub.theoryHours || 0) + (sub.practiceHours || 0) + (sub.testHours || 0);

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          classSubjectId: item.session.classSubjectId,
          subjectId: sub.id,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          teacherName: teacher?.fullName || 'Chưa phân công',
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

    const rowsData = Object.values(groupMap);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tiến độ đào tạo');

    const columnsConfig: any[] = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'TÊN MÔN HỌC', key: 'subjectName', width: 25 },
      { header: 'GIÁO VIÊN', key: 'teacherName', width: 30 },
      { header: 'TỔNG GIỜ MÔN', key: 'totalHours', width: 22 },
      { header: 'TIẾT', key: 'period', width: 10 },
    ];

    for (let w = 1; w <= maxWeeks; w++) {
      const weekStartDate = moment(semStartDate).add((w - 1) * 7, 'days');
      const formattedDate = weekStartDate.format('DD/MM');
      columnsConfig.push({
        header: `TUẦN ${w}\n${formattedDate}`,
        key: `week_${w}`,
        width: 12,
      });
    }
    worksheet.columns = columnsConfig;

    const headerRow = worksheet.getRow(1);
    headerRow.height = 35;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' },
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: 'FF333333' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'medium', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });

    let sttCounter = 0;
    let lastSubjectId: number | null = null;
    let mergeStartRow = 2;

    rowsData.forEach((rowData, index) => {
      const currentRowIndex = index + 2;
      const isSameSubject = rowData.subjectId === lastSubjectId;

      if (!isSameSubject) {
        sttCounter++;
        lastSubjectId = rowData.subjectId;
      }

      const currentProgressStr = `${rowData.totalSubjectScheduled} / ${rowData.totalSubjectHours} tiết\nBuổi này: ${rowData.sessionTotalHours}t`;

      const rowValues: any = {
        stt: isSameSubject ? '' : sttCounter,
        subjectName: `${rowData.subjectName}`,
        teacherName: `${rowData.teacherName}`,
        totalHours: currentProgressStr,
        period: rowData.tietHienThi,
      };

      for (let w = 1; w <= maxWeeks; w++) {
        const periodCount = rowData.weeksData[w];
        rowValues[`week_${w}`] = periodCount !== undefined ? periodCount : '-';
      }

      const row = worksheet.addRow(rowValues);
      row.height = 42;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF444444' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEFEFEF' } },
          bottom: { style: 'thin', color: { argb: 'FFEFEFEF' } },
          left: { style: 'thin', color: { argb: 'FFEFEFEF' } },
          right: { style: 'thin', color: { argb: 'FFEFEFEF' } },
        };

        if (colNumber === 1 || colNumber === 5 || colNumber >= 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 2 || colNumber === 3) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
            indent: 1,
          };
        } else if (colNumber === 4) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };
          cell.font = {
            name: 'Arial',
            size: 9,
            bold: true,
            color: { argb: 'FFFF9800' },
          };
        }

        if (colNumber >= 6 && cell.value === '-') {
          cell.font = { name: 'Arial', size: 10, color: { argb: 'FFB0B0B0' } };
        }
      });

      if (index > 0) {
        const prevRowData = rowsData[index - 1];
        if (rowData.subjectId !== prevRowData.subjectId) {
          if (mergeStartRow < currentRowIndex - 1) {
            worksheet.mergeCells(`A${mergeStartRow}:A${currentRowIndex - 1}`);
            worksheet.mergeCells(`B${mergeStartRow}:B${currentRowIndex - 1}`);
          }
          mergeStartRow = currentRowIndex;
        }
      }

      if (index === rowsData.length - 1) {
        if (mergeStartRow < currentRowIndex) {
          worksheet.mergeCells(`A${mergeStartRow}:A${currentRowIndex}`);
          worksheet.mergeCells(`B${mergeStartRow}:B${currentRowIndex}`);
        }
      }
    });

    const lastRow = worksheet.getRow(worksheet.rowCount);
    lastRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        ...cell.border,
        bottom: { style: 'medium', color: { argb: 'FF888888' } },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }
}
