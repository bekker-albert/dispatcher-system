import assert from "node:assert/strict";
import {
  createXlsxBlob,
  findTableColumn,
  normalizeTableHeader,
  parseCsvRows,
} from "../lib/utils/xlsx";
import { createZipBlob, readZipTextEntries } from "../lib/utils/zip";

assert.equal(normalizeTableHeader("Гос. номер"), "госномер");
assert.equal(normalizeTableHeader("Гос номер"), "госномер");
assert.equal(findTableColumn(["Марка", "Год выпуска", "VIN"], ["год", "год выпуска"]), 1);
assert.equal(findTableColumn(["Марка", "VIN"], ["госномер"]), -1);

assert.deepEqual(parseCsvRows("a,b\n\"c,d\",e"), [
  ["a", "b"],
  ["c,d", "e"],
]);
assert.deepEqual(parseCsvRows("\"a\"\"b\",2"), [["a\"b", "2"]]);

const xlsxBlob = createXlsxBlob([
  ["Марка", "Модель"],
  ["Komatsu", "HD785"],
], "Техника");
assert.equal(xlsxBlob.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
assert.ok(xlsxBlob.size > 0);

const zipBlob = createZipBlob([
  { name: "keep.xml", content: "<keep />" },
  { name: "skip.xml", content: "<skip />" },
]);
const zipEntries = await readZipTextEntries(new File([zipBlob], "selected.zip"), {
  include: (name) => name === "keep.xml",
});

assert.deepEqual(zipEntries, { "keep.xml": "<keep />" });
