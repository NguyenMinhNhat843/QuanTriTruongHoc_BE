import * as ExcelJS from "exceljs";
import {
  HEADER_FILL,
  HEADER_FONT,
  CELL_BORDER,
  CENTER_ALIGNMENT,
} from "../constant/excel-style.constant";

export class ExcelHelper {
  public workbook: ExcelJS.Workbook;
  public currentSheet!: ExcelJS.Worksheet;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  addSheet(name: string): ExcelHelper {
    this.currentSheet = this.workbook.addWorksheet(name);
    this.currentSheet.views = [{ showGridLines: true }];
    return this;
  }

  writeCell(
    cellRef: string,
    value: any,
    options?: {
      font?: Partial<ExcelJS.Font>;
      align?: Partial<ExcelJS.Alignment>;
      mergeTo?: string;
    },
  ) {
    if (options?.mergeTo) {
      this.currentSheet.mergeCells(`${cellRef}:${options.mergeTo}`);
    }
    const cell = this.currentSheet.getCell(cellRef);
    cell.value = value;
    if (options?.font) cell.font = options.font;
    if (options?.align) cell.alignment = options.align;
    return this;
  }

  createTableHeaders(
    startRow: number,
    rowCount: number,
    headerConfigs: Array<{ cells: string; value: string }>,
    colCount: number,
  ) {
    headerConfigs.forEach((cfg) => {
      if (cfg.cells.includes(":")) {
        this.currentSheet.mergeCells(cfg.cells);
        this.currentSheet.getCell(cfg.cells.split(":")[0]).value = cfg.value;
      } else {
        this.currentSheet.getCell(cfg.cells).value = cfg.value;
      }
    });

    for (let r = startRow; r < startRow + rowCount; r++) {
      this.currentSheet.getRow(r).height = 24;
      for (let c = 1; c <= colCount; c++) {
        const cell = this.currentSheet.getCell(r, c);
        cell.fill = HEADER_FILL;
        cell.font = HEADER_FONT;
        cell.alignment = CENTER_ALIGNMENT;
        cell.border = CELL_BORDER;
      }
    }
    return this;
  }

  setColumnWidths(widths: number[]) {
    widths.forEach((w, i) => {
      this.currentSheet.getColumn(i + 1).width = w;
    });
    return this;
  }

  async toBuffer(): Promise<Buffer> {
    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }
}
