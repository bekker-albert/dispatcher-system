export type XlsxColumnOption = {
  width?: number;
  hidden?: boolean;
  outlineLevel?: number;
  collapsed?: boolean;
};

export type XlsxExportOptions = {
  columns?: XlsxColumnOption[];
  outlineSummaryRight?: boolean;
};

type XlsxCellValue = string | number | boolean | null | undefined;

export function normalizeTableHeader(value: string) {
  return value.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]+/g, "");
}

export function findTableColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeTableHeader);

  return headers.findIndex((header) => normalizedAliases.includes(normalizeTableHeader(header)));
}

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

const zipCrcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  bytes.forEach((byte) => {
    crc = zipCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });

  return (crc ^ 0xffffffff) >>> 0;
}

function appendUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function appendUint32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function appendBytes(target: number[], bytes: Uint8Array) {
  bytes.forEach((byte) => target.push(byte));
}

function createZipBlob(entries: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const fileBytes: number[] = [];
  const centralDirectory: number[] = [];

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const contentBytes = encoder.encode(entry.content);
    const checksum = crc32(contentBytes);
    const offset = fileBytes.length;

    appendUint32(fileBytes, 0x04034b50);
    appendUint16(fileBytes, 20);
    appendUint16(fileBytes, 0x0800);
    appendUint16(fileBytes, 0);
    appendUint16(fileBytes, 0);
    appendUint16(fileBytes, 0);
    appendUint32(fileBytes, checksum);
    appendUint32(fileBytes, contentBytes.length);
    appendUint32(fileBytes, contentBytes.length);
    appendUint16(fileBytes, nameBytes.length);
    appendUint16(fileBytes, 0);
    appendBytes(fileBytes, nameBytes);
    appendBytes(fileBytes, contentBytes);

    appendUint32(centralDirectory, 0x02014b50);
    appendUint16(centralDirectory, 20);
    appendUint16(centralDirectory, 20);
    appendUint16(centralDirectory, 0x0800);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint32(centralDirectory, checksum);
    appendUint32(centralDirectory, contentBytes.length);
    appendUint32(centralDirectory, contentBytes.length);
    appendUint16(centralDirectory, nameBytes.length);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint32(centralDirectory, 0);
    appendUint32(centralDirectory, offset);
    appendBytes(centralDirectory, nameBytes);
  });

  const centralDirectoryOffset = fileBytes.length;
  const centralDirectorySize = centralDirectory.length;

  appendBytes(fileBytes, new Uint8Array(centralDirectory));
  appendUint32(fileBytes, 0x06054b50);
  appendUint16(fileBytes, 0);
  appendUint16(fileBytes, 0);
  appendUint16(fileBytes, entries.length);
  appendUint16(fileBytes, entries.length);
  appendUint32(fileBytes, centralDirectorySize);
  appendUint32(fileBytes, centralDirectoryOffset);
  appendUint16(fileBytes, 0);

  return new Blob([new Uint8Array(fileBytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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

export function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"" && quoted && nextChar === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);

  return rows;
}

function zipReadUint16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function zipReadUint32(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

async function inflateZipEntry(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipTextEntries(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoder = new TextDecoder("utf-8");
  let eocdOffset = -1;

  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66000); offset -= 1) {
    if (zipReadUint32(bytes, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) throw new Error("Не удалось прочитать структуру Excel-файла.");

  const entryCount = zipReadUint16(bytes, eocdOffset + 10);
  let directoryOffset = zipReadUint32(bytes, eocdOffset + 16);
  const entries: Record<string, string> = {};

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (zipReadUint32(bytes, directoryOffset) !== 0x02014b50) throw new Error("Excel-файл поврежден.");

    const method = zipReadUint16(bytes, directoryOffset + 10);
    const compressedSize = zipReadUint32(bytes, directoryOffset + 20);
    const fileNameLength = zipReadUint16(bytes, directoryOffset + 28);
    const extraLength = zipReadUint16(bytes, directoryOffset + 30);
    const commentLength = zipReadUint16(bytes, directoryOffset + 32);
    const localHeaderOffset = zipReadUint32(bytes, directoryOffset + 42);
    const fileName = decoder.decode(bytes.slice(directoryOffset + 46, directoryOffset + 46 + fileNameLength)).replace(/\\/g, "/");
    const localNameLength = zipReadUint16(bytes, localHeaderOffset + 26);
    const localExtraLength = zipReadUint16(bytes, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = bytes.slice(dataOffset, dataOffset + compressedSize);
    const contentBytes = method === 0 ? compressedData : method === 8 ? await inflateZipEntry(compressedData) : null;

    if (contentBytes) entries[fileName] = decoder.decode(contentBytes);
    directoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function xmlTextContent(node: Element) {
  return Array.from(node.getElementsByTagName("t")).map((item) => item.textContent ?? "").join("");
}

function parseXlsxCellReference(ref: string) {
  const letters = ref.replace(/[^A-Z]/gi, "").toUpperCase();

  return Array.from(letters).reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function resolveXlsxTarget(basePath: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  if (target.startsWith("xl/")) return target;

  return `${basePath}${target}`.replace(/\/[^/]+\/\.\.\//g, "/");
}

export function parseXlsxSheetRows(entries: Record<string, string>) {
  const parser = new DOMParser();
  const workbook = parser.parseFromString(entries["xl/workbook.xml"] ?? "", "application/xml");
  const workbookRels = parser.parseFromString(entries["xl/_rels/workbook.xml.rels"] ?? "", "application/xml");
  const rels = Object.fromEntries(
    Array.from(workbookRels.getElementsByTagName("Relationship")).map((rel) => [rel.getAttribute("Id") ?? "", rel.getAttribute("Target") ?? ""]),
  );
  const firstSheet = workbook.getElementsByTagName("sheet")[0];
  const relationId = firstSheet?.getAttribute("r:id") ?? "";
  const sheetPath = resolveXlsxTarget("xl/", rels[relationId] ?? "worksheets/sheet1.xml");
  const sharedStringsXml = entries["xl/sharedStrings.xml"];
  const sharedStrings = sharedStringsXml
    ? Array.from(parser.parseFromString(sharedStringsXml, "application/xml").getElementsByTagName("si")).map(xmlTextContent)
    : [];
  const sheetXml = entries[sheetPath];
  if (!sheetXml) throw new Error("В Excel-файле не найден первый лист.");

  const sheet = parser.parseFromString(sheetXml, "application/xml");

  return Array.from(sheet.getElementsByTagName("row")).map((row) => {
    const values: string[] = [];

    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      const ref = cell.getAttribute("r") ?? "";
      const columnIndex = parseXlsxCellReference(ref);
      const type = cell.getAttribute("t");
      const rawValue = cell.getElementsByTagName("v")[0]?.textContent ?? "";
      let value = rawValue;

      if (type === "s") {
        value = sharedStrings[Number(rawValue)] ?? "";
      } else if (type === "inlineStr") {
        value = xmlTextContent(cell);
      }

      values[columnIndex] = value;
    });

    return values.map((value) => value ?? "");
  });
}

export async function parseTableImportFile(file: File) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return parseCsvRows(await file.text());
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Поддерживается импорт .xlsx или .csv.");
  }

  return parseXlsxSheetRows(await readZipTextEntries(file));
}
