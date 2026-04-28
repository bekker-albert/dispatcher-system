import { readZipTextEntries } from "./zip";
import { parseCsvRows } from "./xlsx-csv";

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
