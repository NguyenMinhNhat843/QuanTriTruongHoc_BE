import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ApplicationStatus, Conduct, EducationLevel, Gender } from "../../prisma/generated/prisma/enums";

// Dữ liệu mẫu trích xuất từ hình ảnh
const MOCK_EXCEL_STUDENTS = [
  { lastName: "Nguyễn Quốc", firstName: "Anh", dob: "22/06/2006" },
  { lastName: "Trần Thị", firstName: "Bình", dob: "15/01/1986" },
  { lastName: "Phan Huy", firstName: "Chuẩn", dob: "10/10/1989" },
  { lastName: "Nguyễn Minh", firstName: "Cường", dob: "15/02/1988" },
  { lastName: "Phạm Minh", firstName: "Huy", dob: "21/01/2003" },
  { lastName: "Võ Tấn", firstName: "Lộc", dob: "14/06/2000" },
  { lastName: "Bùi Thị Kiều", firstName: "My", dob: "24/02/2005" },
  { lastName: "Nguyễn Thanh", firstName: "Nhàn", dob: "22/01/1992" },
  { lastName: "Nguyễn Hoàng Ngọc", firstName: "Nhiên", dob: "09/05/2009" },
  { lastName: "Ngô Tấn", firstName: "Phong", dob: "24/08/1997" },
  { lastName: "Trần Anh", firstName: "Sơn", dob: "26/05/1992" },
  { lastName: "Nguyễn Văn", firstName: "Thạnh", dob: "08/02/1988" },
  { lastName: "Trần Thị Kiều", firstName: "Trinh", dob: "01/08/2009" },
  { lastName: "Lâm Nhật", firstName: "Trường", dob: "13/12/1998" },
  { lastName: "Nguyễn Thị Trúc", firstName: "Vân", dob: "23/07/2000" },
  { lastName: "Phạm Ngọc", firstName: "Vinh", dob: "16/03/1996" },
];

@Injectable()
export class AdmissionImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chuyển đổi chuỗi ngày DD/MM/YYYY sang JS Date
   */
  private parseDateString(dateStr: string): Date {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Import danh sách hồ sơ tuyển sinh vào ngành được chỉ định
   */
  async importProfilesFromMockData(campaignMajorId: number) {
    // 1. Kiểm tra CampaignMajor có tồn tại & Lấy thông tin tổ hợp môn
    const campaignMajor = await this.prisma.admissionCampaignMajor.findUnique({
      where: { id: campaignMajorId },
      include: {
        subjectCombination: {
          include: {
            items: true, // Lấy danh sách môn trong tổ hợp
          },
        },
      },
    });

    if (!campaignMajor) {
      throw new NotFoundException(`Không tìm thấy Ngành tuyển sinh với ID: ${campaignMajorId}`);
    }

    if (!campaignMajor.subjectCombination?.items?.length) {
      throw new BadRequestException("Tổ hợp môn xét tuyển chưa có danh sách các môn thi!");
    }

    const subjects = campaignMajor.subjectCombination.items;
    const yearPrefix = new Date().getFullYear();

    // Xác định khối lớp sẽ chèn điểm học bạ (Default: THCS -> lớp 6,7,8,9)
    const educationLevel = EducationLevel.THCS;
    const grades = educationLevel === EducationLevel.THCS ? [6, 7, 8, 9] : [10, 11, 12];

    const results: any[] = [];

    // 2. Chạy Transaction chèn dữ liệu
    await this.prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < MOCK_EXCEL_STUDENTS.length; i++) {
          const item = MOCK_EXCEL_STUDENTS[i];
          const fullName = `${item.lastName} ${item.firstName}`.trim();

          // Random mã định danh/CCCD và SĐT không bị trùng lặp
          const sequence = (i + 1).toString().padStart(4, "0");
          const identityNumber = `042096${sequence}${Math.floor(10 + Math.random() * 90)}`;
          const applicationCode = `HS${yearPrefix}-${sequence}`;
          const phone = `098${Math.floor(1000000 + Math.random() * 9000000)}`;

          // Chuẩn bị dữ liệu Điểm thi (3 môn x 4 năm = 12 bản ghi điểm 10.0)
          const transcriptScoresData: any = [];
          for (const grade of grades) {
            for (const subject of subjects) {
              transcriptScoresData.push({
                gradeLevel: grade,
                subjectCode: subject.subjectName,
                score: 10.0, // Auto điểm 10
              });
            }
          }

          // Tạo Hồ sơ xét tuyển
          const profile = await tx.admissionProfile.create({
            data: {
              applicationCode,
              admissionCampaignMajorId: campaignMajor.id,
              subjectCombinationId: campaignMajor.subjectCombinationId,
              status: ApplicationStatus.REGISTERED,
              educationLevel: educationLevel,

              // Thông tin cá nhân
              fullName,
              identityNumber,
              dob: this.parseDateString(item.dob),
              gender: item.lastName.includes("Thị") ? Gender.FEMALE : Gender.MALE,
              phone,
              email: `hocsinh${sequence}@gmail.com`,

              // Hạnh kiểm Auto TỐT cho tất cả các năm học
              conduct6: Conduct.TOT,
              conduct7: Conduct.TOT,
              conduct8: Conduct.TOT,
              conduct9: Conduct.TOT,
              conduct10: Conduct.TOT,
              conduct11: Conduct.TOT,
              conduct12: Conduct.TOT,

              // Điểm TB 3 môn (auto 10)
              avgSubjectScore: 30.0,

              // Chèn điểm chi tiết các môn
              transcriptSubjectScores: {
                create: transcriptScoresData,
              },

              // Ghi log khởi tạo
              statusLogs: {
                create: {
                  toStatus: ApplicationStatus.REGISTERED,
                  isSystem: true,
                  reason: "Khởi tạo hồ sơ tự động từ Mock Data Excel",
                },
              },
            },
          });

          results.push(profile);
        }
      },
      {
        timeout: 60000, // 60 giây
      },
    );

    return {
      message: `Đã import thành công ${results.length} hồ sơ học sinh!`,
      insertedCount: results.length,
      data: results,
    };
  }
}
