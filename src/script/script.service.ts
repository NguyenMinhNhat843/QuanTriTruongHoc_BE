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

      // 1. Lấy thông tin Lớp ở ô B2 (Ví dụ: "Lớp: TC24HD1")
      const classCellVal = worksheet.getCell("A2").value?.toString() || "";
      const classCode = classCellVal.replace(/Lớp:\s*/i, "").trim();

      if (!classCode) {
        continue; // Bỏ qua nếu không tìm thấy mã lớp học
      }

      // 2. Tìm môn học dựa trên tên sheet (so khớp tương đối hoặc tuyệt đối)
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
      console.log(`Found subject for sheet "${sheetName}":`, subject);

      if (!subject) {
        importResults.push({
          sheet: sheetName,
          status: "FAILED",
          message: `Không tìm thấy môn học khớp với tên sheet "${sheetName}"`,
        });
        continue;
      }

      // Tìm lớp học phần (CourseOffer) tương ứng của môn học này cho Lớp học này
      const courseOffer = await this.prisma.courseOffer.findFirst({
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

      // 3. PHÂN TÍCH ĐỘNG CỘT ĐIỂM (Hàng 6 và 7)
      const headerRow7 = worksheet.getRow(7);

      const kttxCols: number[] = [];
      const ktdkCols: number[] = [];
      let tbCol: number | null = null;
      const ktktCols: number[] = []; // Điểm kiểm tra kết thúc (Lần 1, Lần 2)
      let tk1Col: number | null = null; // Tổng kết lần 1
      let tk2Col: number | null = null; // Tổng kết lần 2
      let noteCol: number | null = null; // Ghi chú

      // Quét từ cột E (cột 5) đến cột S (cột 19) để map header
      let currentGroup: "KTTX" | "KTDK" | "KTKT" | null = null;

      for (let colIdx = 5; colIdx <= 20; colIdx++) {
        const val6 = headerRow7.getCell(colIdx).value?.toString()?.trim() || "";

        // Xác định group lớn dựa trên hàng 6
        if (val6.includes("KT TX") || val6.includes("KTTX")) {
          currentGroup = "KTTX";
        } else if (val6.includes("KT ĐK") || val6.includes("KTĐK")) {
          currentGroup = "KTDK";
        } else if (val6.includes("TB")) {
          currentGroup = null;
          tbCol = colIdx;
        } else if (
          val6.includes("Điểm kiểm tra kết thúc") ||
          val6.includes("KTKT")
        ) {
          currentGroup = "KTKT";
        } else if (
          val6.includes("Điểm tổng kết lần 1") ||
          val6.includes("tổng kết lần 1") ||
          val6.includes("kết lần 1") ||
          val6.includes("kết 1")
        ) {
          currentGroup = null;
          tk1Col = colIdx;
        } else if (
          val6.includes("Điểm tổng kết lần 2") ||
          val6.includes("tổng kết lần 2") ||
          val6.includes("kết lần 2") ||
          val6.includes("kết 2")
        ) {
          currentGroup = null;
          tk2Col = colIdx;
        } else if (val6.includes("Ghi chú")) {
          currentGroup = null;
          noteCol = colIdx;
        }

        // Đẩy cột vào nhóm tương ứng dựa theo group đang hoạt động
        if (currentGroup === "KTTX") {
          kttxCols.push(colIdx);
        } else if (currentGroup === "KTDK") {
          ktdkCols.push(colIdx);
        } else if (currentGroup === "KTKT") {
          ktktCols.push(colIdx);
        }
      }

      // 4. ĐỌC DỮ LIỆU HỌC SINH TỪ HÀNG 9
      let rowIdx = 9;
      let successCount = 0;

      while (true) {
        const row = worksheet.getRow(rowIdx);
        const stt = row.getCell(1).value; // Cột A (STT)

        // Dừng lại nếu gặp dòng Tổng số hoặc không còn dữ liệu STT
        if (
          !stt ||
          stt.toString().trim() === "" ||
          stt.toString().includes("Tổng số")
        ) {
          break;
        }

        // Ghép Họ và tên lót (Cột B) + Tên (Cột C) để tìm kiếm sinh viên
        const hoDem = row.getCell(2).value?.toString()?.trim() || "";
        const ten = row.getCell(3).value?.toString()?.trim() || "";
        const fullName = `${hoDem} ${ten}`.trim();

        if (!fullName) {
          rowIdx++;
          continue;
        }

        // Tìm học sinh thuộc lớp này dựa vào tên học sinh
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
          continue; // Bỏ qua hoặc log lỗi nếu không tìm thấy sinh viên đúng tên trong lớp
        }

        // Hàm helper parse điểm an toàn
        const parseScore = (val: any): number | null => {
          if (val === undefined || val === null || val === "") return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        // Gán các cột điểm động đã map
        const kttx1 = kttxCols[0]
          ? parseScore(row.getCell(kttxCols[0]).value)
          : null;
        const kttx2 = kttxCols[1]
          ? parseScore(row.getCell(kttxCols[1]).value)
          : null;
        const kttx3 = kttxCols[2]
          ? parseScore(row.getCell(kttxCols[2]).value)
          : null;

        const ktdk1 = ktdkCols[0]
          ? parseScore(row.getCell(ktdkCols[0]).value)
          : null;
        const ktdk2 = ktdkCols[1]
          ? parseScore(row.getCell(ktdkCols[1]).value)
          : null;
        const ktdk3 = ktdkCols[2]
          ? parseScore(row.getCell(ktdkCols[2]).value)
          : null;
        const ktdk4 = ktdkCols[3]
          ? parseScore(row.getCell(ktdkCols[3]).value)
          : null;

        const diemTB = tbCol ? parseScore(row.getCell(tbCol).value) : null;

        const diemKiemTra1 = ktktCols[0]
          ? parseScore(row.getCell(ktktCols[0]).value)
          : null;
        const diemKiemTra2 = ktktCols[1]
          ? parseScore(row.getCell(ktktCols[1]).value)
          : null;

        const diemTongKet1 = tk1Col
          ? parseScore(row.getCell(tk1Col).value)
          : null;
        const diemTongKet2 = tk2Col
          ? parseScore(row.getCell(tk2Col).value)
          : null;

        const note = noteCol
          ? row.getCell(noteCol).value?.toString() || null
          : null;

        // Lưu / Cập nhật vào DB bằng upsert
        await this.prisma.gradeStudent.upsert({
          where: {
            studentId_courseOfferId: {
              studentId: student.id,
              courseOfferId: courseOffer.id,
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
            courseOfferId: courseOffer.id,
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
        message: `Đã import thành công ${successCount} học sinh môn "${subject.subjectName}"`,
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
      throw new BadRequestException(
        `Không tìm thấy đợt đánh giá có ID: ${periodId}`,
      );
    }

    const periodCriteria = period.periodCriteria;
    if (periodCriteria.length === 0) {
      throw new BadRequestException(
        "Đợt đánh giá này chưa được cấu hình tiêu chí chấm điểm!",
      );
    }

    // Tính tổng số điểm tối đa của toàn bộ đợt này
    const totalMaxScoreOfPeriod = periodCriteria.reduce(
      (sum, pc) => sum + pc.criterion.maxScore,
      0,
    );

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
      const fullNameFromExcel = `${lastName} ${firstName}`
        .replace(/\s+/g, " ")
        .trim();

      // Điểm tổng đọc từ Excel
      const rawStudentScore = Number(row.getCell("E").value ?? 0);
      const rawTeacherScore = Number(row.getCell("G").value ?? 0);

      // Giới hạn điểm tối đa không vượt quá cấu hình đợt
      const totalStudentScore = Math.min(
        rawStudentScore,
        totalMaxScoreOfPeriod,
      );
      const totalTeacherScore = Math.min(
        rawTeacherScore,
        totalMaxScoreOfPeriod,
      );

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
        results.errors.push(
          `Dòng ${i} (Học sinh ${fullNameFromExcel}): Lỗi hệ thống khi lưu - ${error.message}`,
        );
      }
    }

    return {
      message: "Hoàn thành quá trình import điểm rèn luyện!",
      data: results,
    };
  }
}
