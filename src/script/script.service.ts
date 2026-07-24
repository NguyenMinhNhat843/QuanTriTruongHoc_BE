import { BadRequestException, Injectable } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GradeImportService {
  constructor(private prisma: PrismaService) {}

  async importGradesFromExcel(fileBuffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const importResults: any = [];

    // Duyệt qua từng sheet trong file Excel
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;

      // 1. Lấy thông tin Lớp ở ô A5 (Ví dụ: "Lớp: TC23TH1")
      const classCellVal = worksheet.getCell("A5").value?.toString() || "";
      const classCode = classCellVal.replace(/Lớp:\s*/i, "").trim();

      if (!classCode) {
        continue; // Bỏ qua nếu không tìm thấy mã lớp học
      }

      // Tìm Class trước
      const classObj = await this.prisma.class.findUnique({
        where: { classCode },
      });

      if (!classObj) {
        importResults.push({
          sheet: sheetName,
          status: "FAILED",
          message: `Không tìm thấy lớp ${classCode} trong hệ thống`,
        });
        continue;
      }

      // Tìm môn học có tên giống/gần giống tên sheet
      const subject = await this.prisma.subject.findFirst({
        where: {
          subjectCode: {
            contains: sheetName.trim(),
            mode: "insensitive",
          },
        },
      });

      if (!subject) {
        importResults.push({
          sheet: sheetName,
          status: "FAILED",
          message: `Không tìm thấy môn học khớp với tên sheet "${sheetName}"`,
        });
        continue;
      }

      // Tìm lớp học phần (CourseOffer) tương ứng
      const courseOffer = await this.prisma.classSubject.findFirst({
        where: {
          classId: classObj.id,
          subjectId: subject.id,
        },
      });

      if (!courseOffer) {
        importResults.push({
          sheet: sheetName,
          status: "FAILED",
          message: `Không tìm thấy lớp học phần (CourseOffer) của môn "${subject.subjectName}" cho lớp ${classCode}`,
        });
        continue;
      }

      // 2. PHÂN TÍCH ĐỘNG CỘT ĐIỂM (Dựa vào hàng 9 trong file mẫu)
      const headerRow9 = worksheet.getRow(9);

      const kttxCols: number[] = [];
      const ktdkCols: number[] = [];
      const ktktCols: number[] = []; // Cột điểm KTKT L1, L2
      let noteCol: number | null = null; // Ghi chú

      let currentGroup: "KTTX" | "KTDK" | "KTKT" | null = null;

      // Quét từ cột E (5) đến cột P (16) để xác định vị trí cột
      for (let colIdx = 5; colIdx <= 16; colIdx++) {
        const val9 = headerRow9.getCell(colIdx).value?.toString()?.trim() || "";

        if (val9.includes("KTTX")) {
          currentGroup = "KTTX";
        } else if (val9.includes("KTĐK") || val9.includes("KTDK")) {
          currentGroup = "KTDK";
        } else if (val9.includes("Điểm KTKT") || val9.includes("KTKT")) {
          currentGroup = "KTKT";
        } else if (val9.includes("TBKT") || val9.includes("Điểm tổng kết")) {
          currentGroup = null; // Bỏ qua các cột điểm trung bình/tổng kết gốc của Excel vì hệ thống tự tính
        } else if (val9.includes("Ghi chú")) {
          currentGroup = null;
          noteCol = colIdx;
        }

        // Đẩy cột vào nhóm tương ứng
        if (currentGroup === "KTTX") {
          kttxCols.push(colIdx);
        } else if (currentGroup === "KTDK") {
          ktdkCols.push(colIdx);
        } else if (currentGroup === "KTKT") {
          ktktCols.push(colIdx);
        }
      }

      // 3. ĐỌC DỮ LIỆU HỌC SINH BẮT ĐẦU TỪ HÀNG 11
      let rowIdx = 11;
      let successCount = 0;

      while (true) {
        const row = worksheet.getRow(rowIdx);
        const stt = row.getCell(1).value; // Cột A (STT)

        // Dừng lại nếu hết danh sách hoặc gặp dòng tổng kết cuối bảng
        if (!stt || stt.toString().trim() === "" || stt.toString().includes("Tổng số")) {
          break;
        }

        // Ghép Họ và tên lót (Cột B) + Tên (Cột C)
        const hoDem = row.getCell(2).value?.toString()?.trim() || "";
        const ten = row.getCell(3).value?.toString()?.trim() || "";
        const fullName = `${hoDem} ${ten}`.trim();

        if (!fullName) {
          rowIdx++;
          continue;
        }

        // Tìm học sinh thuộc lớp này
        const student = await this.prisma.student.findFirst({
          where: {
            classId: classObj.id,
            fullName: {
              equals: fullName,
              mode: "insensitive",
            },
          },
        });

        if (!student) {
          rowIdx++;
          continue; // Bỏ qua nếu không tìm thấy sinh viên
        }

        // Helper parse điểm số, chuyển đổi định dạng dấu phẩy của Việt Nam (ví dụ "8,3" -> 8.3)
        const parseScore = (val: any): number | null => {
          if (val === undefined || val === null || val === "") return null;

          let normalizedVal = val.toString().trim();
          // Thay thế dấu phẩy thành dấu chấm để chuyển đổi sang kiểu Number hợp lệ
          normalizedVal = normalizedVal.replace(",", ".");

          const num = Number(normalizedVal);
          return isNaN(num) ? null : num;
        };

        // Đọc các giá trị điểm thô từ Excel
        const kttxScores = kttxCols
          .map((col) => parseScore(row.getCell(col).value))
          .filter((v) => v !== null) as number[];
        const ktdkScores = ktdkCols
          .map((col) => parseScore(row.getCell(col).value))
          .filter((v) => v !== null) as number[];

        const diemKiemTra1 = ktktCols[0] ? parseScore(row.getCell(ktktCols[0]).value) : null;
        const diemKiemTra2 = ktktCols[1] ? parseScore(row.getCell(ktktCols[1]).value) : null;

        // --- 4. TỰ ĐỘNG TÍNH TOÁN ĐIỂM THEO CÔNG THỨC ---

        // Tính Điểm TBKT: (KTTX * 1 + KTDK * 2) / Tổng hệ số
        let diemTB: number | null = null;
        const ttxSum = kttxScores.reduce((sum, val) => sum + val, 0);
        const tdkSum = ktdkScores.reduce((sum, val) => sum + val, 0);
        const totalWeights = kttxScores.length * 1 + ktdkScores.length * 2;

        if (totalWeights > 0) {
          const rawTB = (ttxSum * 1 + tdkSum * 2) / totalWeights;
          diemTB = Math.round(rawTB * 10) / 10; // Làm tròn 1 chữ số thập phân
        }

        // Tính Điểm Tổng Kết Lần 1: (diemTB * 0.4) + (diemKiemTra1 * 0.6)
        let diemTongKet1: number | null = null;
        if (diemTB !== null && diemKiemTra1 !== null) {
          const rawTK1 = diemTB * 0.4 + diemKiemTra1 * 0.6;
          diemTongKet1 = Math.round(rawTK1 * 10) / 10;
        }

        // Tính Điểm Tổng Kết Lần 2 (nếu có thi Lần 2): (diemTB * 0.4) + (diemKiemTra2 * 0.6)
        let diemTongKet2: number | null = null;
        if (diemTB !== null && diemKiemTra2 !== null) {
          const rawTK2 = diemTB * 0.4 + diemKiemTra2 * 0.6;
          diemTongKet2 = Math.round(rawTK2 * 10) / 10;
        }

        const note = noteCol ? row.getCell(noteCol).value?.toString() || null : null;

        // Gán các biến điểm cụ thể để lưu trữ vào database
        const kttx1 = kttxScores[0] ?? null;
        const kttx2 = kttxScores[1] ?? null;
        const kttx3 = kttxScores[2] ?? null;

        const ktdk1 = ktdkScores[0] ?? null;
        const ktdk2 = ktdkScores[1] ?? null;
        const ktdk3 = ktdkScores[2] ?? null;
        const ktdk4 = ktdkScores[3] ?? null;

        // Lưu / Cập nhật vào DB bằng upsert
        await this.prisma.gradeStudent.upsert({
          where: {
            studentId_classSubjectId: {
              studentId: student.id,
              classSubjectId: courseOffer.id,
            },
          },
          update: {
            kttx1,
            kttx2,
            kttx3,
            ktdk1,
            ktdk2,
            ktdk3,
            ktdk4,
            diemTB,
            diemKiemTra1,
            diemKiemTra2,
            diemTongKet1,
            diemTongKet2,
            note,
          },
          create: {
            studentId: student.id,
            classSubjectId: courseOffer.id,
            kttx1,
            kttx2,
            kttx3,
            ktdk1,
            ktdk2,
            ktdk3,
            ktdk4,
            diemTB,
            diemKiemTra1,
            diemKiemTra2,
            diemTongKet1,
            diemTongKet2,
            note,
          },
        });

        successCount++;
        rowIdx++;
      }

      importResults.push({
        sheet: sheetName,
        status: "SUCCESS",
        message: `Đã import và tính toán thành công ${successCount} học sinh môn "${subject.subjectName}"`,
      });
    }

    return importResults;
  }

  async importAssessmentFromExcel(fileBuffer: Buffer, periodId: number) {
    // 1. Kiểm tra xem Đợt đánh giá (EvaluationPeriod) có tồn tại không
    const period = await this.prisma.evaluationPeriod.findUnique({
      where: { id: periodId },
      include: {
        periodCriteria: {
          include: {
            criterion: true,
          },
          orderBy: {
            criterion: {
              sortOrder: "asc",
            },
          },
        },
      },
    });

    if (!period) {
      throw new BadRequestException(`Không tìm thấy đợt đánh giá có ID: ${periodId}`);
    }

    const periodCriteria = period.periodCriteria;
    if (periodCriteria.length === 0) {
      throw new BadRequestException("Đợt đánh giá này chưa được cấu hình tiêu chí chấm điểm!");
    }

    // Tính tổng số điểm tối đa của toàn bộ đợt này
    const totalMaxScoreOfPeriod = periodCriteria.reduce((sum, pc) => sum + pc.criterion.maxScore, 0);

    // 2. Đọc file Excel bằng ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    // Lấy sheet đầu tiên
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException("File excel không chứa dữ liệu!");
    }

    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [] as string[],
    };

    // 3. Duyệt danh sách học sinh từ dòng 10 trở đi
    const startRow = 10;
    const rowCount = worksheet.rowCount;

    for (let i = startRow; i <= rowCount; i++) {
      const row = worksheet.getRow(i);

      // Nếu cột STT hoặc Mã học sinh trống thì dừng hoặc bỏ qua
      const stt = row.getCell("A").value;
      const studentCodeVal = row.getCell("B").value;

      if (!stt) {
        break; // Bỏ qua dòng trống hoặc dòng ký tên ở cuối file
      }

      const classCode = worksheet.getCell("N4").value?.toString().trim() || "";
      const studentCode = studentCodeVal?.toString().trim();

      const lastName = row.getCell("C").value?.toString().trim() || "";
      const firstName = row.getCell("D").value?.toString().trim() || "";
      const fullNameFromExcel = `${lastName} ${firstName}`.replace(/\s+/g, " ").trim();

      // Điểm tổng đọc từ Excel
      const rawStudentScore = Number(row.getCell("E").value ?? 0);
      const rawTeacherScore = Number(row.getCell("G").value ?? 0);

      // Giới hạn điểm tối đa không vượt quá cấu hình đợt
      const totalStudentScore = Math.min(rawStudentScore, totalMaxScoreOfPeriod);
      const totalTeacherScore = Math.min(rawTeacherScore, totalMaxScoreOfPeriod);

      try {
        // 4. Tìm kiếm học sinh
        const student = await this.prisma.student.findFirst({
          where: {
            fullName: {
              equals: fullNameFromExcel,
              mode: "insensitive", // Giúp tìm chính xác dù file Excel viết hoa/thường lệch với DB
            },
            class: {
              is: {
                classCode: classCode,
              },
            },
          },
        });

        if (!student) {
          results.failedCount++;
          results.errors.push(
            `Dòng ${i}: Không tìm thấy học sinh [${fullNameFromExcel}] (Mã số Excel: ${studentCode}) trong database.`,
          );
          continue;
        }
        // 5. Giải thuật phân bổ điểm chi tiết (Điền tối đa từ trên xuống dưới cho đến khi đủ tổng)
        const detailsDataToInsert: {
          periodCriterionId: number;
          studentScore: number;
          teacherScore: number;
        }[] = [];

        let remainingStudentPoints = totalStudentScore;
        let remainingTeacherPoints = totalTeacherScore;

        for (const pCriterion of periodCriteria) {
          const maxScore = pCriterion.criterion.maxScore;

          // Phân bổ cho Học sinh tự chấm
          let allocatedStudentScore = 0;
          if (remainingStudentPoints > 0) {
            allocatedStudentScore = Math.min(remainingStudentPoints, maxScore);
            remainingStudentPoints -= allocatedStudentScore;
          }

          // Phân bổ cho Giáo viên chấm
          let allocatedTeacherScore = 0;
          if (remainingTeacherPoints > 0) {
            allocatedTeacherScore = Math.min(remainingTeacherPoints, maxScore);
            remainingTeacherPoints -= allocatedTeacherScore;
          }

          detailsDataToInsert.push({
            periodCriterionId: pCriterion.id,
            studentScore: allocatedStudentScore,
            teacherScore: allocatedTeacherScore,
          });
        }

        // 6. Thực hiện lưu vào Database bằng Prisma Transaction (Upsert Assessment & Details)
        await this.prisma.$transaction(async (tx) => {
          // Tạo hoặc cập nhật phiếu điểm chính (Assessment)
          const assessment = await tx.assessment.upsert({
            where: {
              studentId_periodId: {
                studentId: student.id,
                periodId: periodId,
              },
            },
            create: {
              studentId: student.id,
              periodId: periodId,
              status: "APPROVED", // Sét mặc định GVCN đã duyệt vì đây là data tổng hợp cuối kỳ
              totalStudentScore: totalStudentScore,
              totalTeacherScore: totalTeacherScore,
            },
            update: {
              totalStudentScore: totalStudentScore,
              totalTeacherScore: totalTeacherScore,
              status: "APPROVED",
            },
          });

          // Tạo/Cập nhật chi tiết từng tiêu chí (AssessmentDetail)
          for (const detail of detailsDataToInsert) {
            await tx.assessmentDetail.upsert({
              where: {
                assessmentId_periodCriterionId: {
                  assessmentId: assessment.id,
                  periodCriterionId: detail.periodCriterionId,
                },
              },
              create: {
                assessmentId: assessment.id,
                periodCriterionId: detail.periodCriterionId,
                studentScore: detail.studentScore,
                teacherScore: detail.teacherScore,
              },
              update: {
                studentScore: detail.studentScore,
                teacherScore: detail.teacherScore,
              },
            });
          }
        });

        results.successCount++;
      } catch (error: any) {
        results.failedCount++;
        results.errors.push(`Dòng ${i} (Học sinh ${fullNameFromExcel}): Lỗi hệ thống khi lưu - ${error.message}`);
      }
    }

    return {
      message: "Hoàn thành quá trình import điểm rèn luyện!",
      data: results,
    };
  }
}
