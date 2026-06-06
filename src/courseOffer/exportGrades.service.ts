import { Injectable, NotFoundException } from "@nestjs/common";
import * as ExcelJS from "exceljs";
import * as path from "path";
import { CourseOfferQuery } from "./classSubject.query";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ExportGradeTableService {
  constructor(
    private courseOfferQuery: CourseOfferQuery,
    private prisma: PrismaService,
  ) {}
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
