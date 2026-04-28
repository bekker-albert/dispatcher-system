import { createZipBlob } from "./zip";
import type { XlsxCellValue, XlsxColumnOption, XlsxExportOptions } from "./xlsx-types";

function escapeExcelCell(value: XlsxCellValue) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeExcelSheetName(value: string) {
  const name = value.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Лист1";
  return escapeExcelCell(name);
}

function columnName(index: number) {
  let value = index + 1;
  let name = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function createWorksheetColumnsXml(columns: XlsxColumnOption[] | undefined) {
  if (!columns?.length) return "";

  const columnXml = columns
    .map((column, index) => {
      const attributes = [
        `min="${index + 1}"`,
        `max="${index + 1}"`,
        `width="${column.width ?? 10}"`,
        "customWidth=\"1\"",
        column.hidden ? "hidden=\"1\"" : "",
        column.outlineLevel ? `outlineLevel="${column.outlineLevel}"` : "",
        column.collapsed ? "collapsed=\"1\"" : "",
      ].filter(Boolean).join(" ");

      return `<col ${attributes}/>`;
    })
    .join("");

  return `<cols>${columnXml}</cols>`;
}

function createWorksheetXml(rows: XlsxCellValue[][], options: XlsxExportOptions = {}) {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;

          if (typeof cell === "number" && Number.isFinite(cell)) {
            return `<c r="${ref}"><v>${cell}</v></c>`;
          }

          return `<c r="${ref}" t="inlineStr"><is><t>${escapeExcelCell(cell)}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const sheetPr = options.columns?.some((column) => column.outlineLevel || column.collapsed)
    ? `<sheetPr><outlinePr summaryRight="${options.outlineSummaryRight === false ? 0 : 1}" summaryBelow="1"/></sheetPr>`
    : "";
  const columns = createWorksheetColumnsXml(options.columns);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sheetPr}${columns}<sheetData>${body}</sheetData></worksheet>`;
}

export function createXlsxBlob(rows: XlsxCellValue[][], sheetName = "Техника", options: XlsxExportOptions = {}) {
  return createZipBlob([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeExcelSheetName(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: createWorksheetXml(rows, options),
    },
  ]);
}
