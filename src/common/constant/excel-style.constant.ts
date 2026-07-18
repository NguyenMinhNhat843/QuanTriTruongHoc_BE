import * as ExcelJS from "exceljs";

export const DEFAULT_FONT: Partial<ExcelJS.Font> = {
  name: "Times New Roman",
  size: 11,
};
export const BOLD_FONT: Partial<ExcelJS.Font> = {
  name: "Times New Roman",
  size: 11,
  bold: true,
};
export const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: "Times New Roman",
  size: 16,
  bold: true,
  color: { argb: "FF1F497D" },
};

// Sửa lại Header dùng màu xám ghi sáng, chữ đen theo đúng chuẩn bảng điểm của bạn
export const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: "Times New Roman",
  size: 11,
  bold: true,
  color: { argb: "000000" },
};
export const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF2F2F2" },
};

export const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

export const CENTER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};
export const LEFT_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: "left",
  vertical: "middle",
  indent: 1,
  wrapText: true,
};
