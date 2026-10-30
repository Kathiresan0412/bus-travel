import { Readable } from "node:stream";
import ExcelJS from "exceljs";

export const MAX_NOTEBOOK_BYTES = 5 * 1024 * 1024;
export const MAX_NOTEBOOK_ROWS = 20000;
export const MAX_NOTEBOOK_COLUMNS = 100;
export type NotebookRow = { number: number; cells: string[] };
export type NotebookData = { columns: { index: number; label: string }[]; rows: NotebookRow[]; totalRows: number };

export async function readNotebook(file: File): Promise<NotebookData> {
  if (file.size < 1 || file.size > MAX_NOTEBOOK_BYTES) throw new Error("Choose a non-empty CSV or XLSX file smaller than 5 MB");
  const name = file.name.toLowerCase(); const buffer = Buffer.from(await file.arrayBuffer()); const workbook = new ExcelJS.Workbook();
  if (name.endsWith(".xlsx")) await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  else if (name.endsWith(".csv")) await workbook.csv.read(Readable.from([buffer.toString("utf8")]));
  else throw new Error("This import accepts .csv and .xlsx files");
  const sheet = workbook.worksheets[0]; if (!sheet || sheet.rowCount < 2) throw new Error("The first sheet must contain a header and at least one data row");
  if (sheet.rowCount > MAX_NOTEBOOK_ROWS + 1) throw new Error(`Import is limited to ${MAX_NOTEBOOK_ROWS.toLocaleString()} records`);
  const header = sheet.getRow(1); const width = Math.min(header.cellCount, MAX_NOTEBOOK_COLUMNS);
  if (!width) throw new Error("The first row must contain column headers");
  const columns = Array.from({ length: width }, (_, offset) => ({ index: offset + 1, label: header.getCell(offset + 1).text.trim() || `Column ${offset + 1}` }));
  const rows: NotebookRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    rows.push({ number: rowNumber, cells: columns.map(column => row.getCell(column.index).text.trim()) });
  });
  if (!rows.length) throw new Error("No data rows were found below the header");
  return { columns, rows, totalRows: rows.length };
}

export function parseNotebookDate(raw: string, format: "yyyy-mm-dd" | "dd/mm/yyyy" | "mm/dd/yyyy") {
  const text = raw.trim(); if (!text) return null;
  let year = 0; let month = 0; let day = 0;
  const excelSerial = Number(text);
  if (/^\d+(?:\.\d+)?$/.test(text) && excelSerial >= 20000 && excelSerial <= 90000) return new Date(Date.UTC(1899, 11, 30) + Math.floor(excelSerial) * 86400000);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) [, year, month, day] = [iso[0], Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else {
    const parts = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/.exec(text);
    if (!parts) return null;
    const a = Number(parts[1]); const b = Number(parts[2]); const y = Number(parts[3]);
    year = y < 100 ? 2000 + y : y;
    if (format === "dd/mm/yyyy") { day = a; month = b; } else if (format === "mm/dd/yyyy") { month = a; day = b; } else return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function parseNotebookMoney(raw: string) {
  const normalized = raw.trim().replace(/[\s,LKR$€£¥]/gi, "").replace(/[()]/g, "");
  if (!normalized) return null;
  const negative = /^-/.test(normalized) || (raw.trim().startsWith("(") && raw.trim().endsWith(")"));
  const amount = Number(normalized.replace(/,/g, "").replace(/^-/, ""));
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000) return null;
  return Math.round((negative ? -amount : amount) * 100);
}
