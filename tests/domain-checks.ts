import assert from "node:assert/strict";
import { clientSnapshotAutoMinIntervalMs, clientSnapshotSaveDelayMs, sharedAppSettingKeys } from "../lib/domain/app/settings";
import { cloneUndoSnapshot, type UndoSnapshot } from "../lib/domain/app/undo";
import { adminLogLimit, normalizeAdminLogEntry } from "../lib/domain/admin/logs";
import { adminSectionTabs, structureSectionTabs } from "../lib/domain/admin/navigation";
import { defaultDependencyLinks, defaultDependencyNodes, defaultOrgMembers, dependencyNodeLabel, dependencyStages, orgMemberLabel } from "../lib/domain/admin/structure";
import { buildDispatchAiSuggestion, buildDispatchSummaryRowView, consolidateDispatchSummaryRows, createDispatchSummaryRow, normalizeDispatchSummaryRows } from "../lib/domain/dispatch/summary";
import { compactSubTabLabel, compactTopTabLabel, createDefaultSubTabs, customTabKey, defaultTopTabs, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs } from "../lib/domain/navigation/tabs";
import { createPtoBucketColumns, createPtoBucketRows, createPtoBucketRowsModel, isLoadingEquipment, loadingEquipmentLabel, normalizePtoBucketManualRows, ptoBucketCellKey, ptoBucketRowKey, ptoBucketRowsSignature, ptoBucketSelectionKey } from "../lib/domain/pto/buckets";
import { dateRange, distributeMonthlyTotal, emptyPtoDraftRowFields, isPtoDateTableKey, nextDate, normalizePtoCustomerCode, normalizePtoPlanRow, ptoColumnDefaults, ptoDateTableKeyFromTab } from "../lib/domain/pto/date-table";
import { defaultPtoOperRows, defaultPtoPlanRows, defaultPtoSurveyRows, defaultReportDate } from "../lib/domain/pto/defaults";
import { createPtoPlanExportRows, createPtoPlanRowsFromImportTable, ensureImportedRowsInLinkedPtoTable, mergeImportedPtoPlanRows, ptoDateExportFileName, ptoDateTableMeta } from "../lib/domain/pto/excel";
import { formatBucketNumber, formatPtoCellNumber, formatPtoFormulaNumber, parseDecimalInput, parseDecimalValue } from "../lib/domain/pto/formatting";
import { defaultReportCustomers } from "../lib/domain/reports/defaults";
import { formatDateInputValue, isStoredReportDateValue, resolveReportDateAreaContext } from "../features/reports/lib/reportDateSelection";
import { defaultContractors, defaultFuelContractors, defaultFuelGeneral, defaultUserCard } from "../lib/domain/reference/defaults";
import { createDefaultVehicles, createVehicleSeedVersion, defaultVehicleFallbackRows, defaultVehicleForm, normalizeVehicleRow } from "../lib/domain/vehicles/defaults";
import { buildVehicleDisplayName, createVehicleExportRows, createVehiclesFromImportTable } from "../lib/domain/vehicles/import-export";
import { createVehicleFilterOptions, createVehicleFilterOptionsForKey, createVehicleFilterSets, mergeVehicleFilterOptions, vehicleMatchesFilters } from "../lib/domain/vehicles/filtering";
import { adminVehicleFallbackPreviewRows, adminVehicleMinPreviewRows, adminVehicleViewportBottomReserve, parseVehicleInlineFieldDomKey, vehicleAutocompleteFilterKeys, vehicleFieldIsNumeric, vehicleFilterColumnConfigs, vehicleInlineFieldDomKey, vehicleInlineFields } from "../lib/domain/vehicles/grid";
import { adminStorageKeys } from "../lib/storage/keys";
import { createId } from "../lib/utils/id";
import { parseDecimalInput as parseUtilityDecimalInput } from "../lib/utils/numbers";
import { errorToMessage, mergeDefaultsById, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "../lib/utils/normalizers";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "../lib/utils/text";

const nbsp = "\u00a0";

assert.equal(parseDecimalInput(" 1 234,56 "), 1234.56);
assert.equal(parseUtilityDecimalInput("12,5"), 12.5);
assert.equal(parseDecimalInput("-"), null);
assert.equal(parseDecimalValue("bad"), 0);
assert.equal(formatPtoCellNumber(1234.567), `1${nbsp}234,57`);
assert.equal(formatPtoFormulaNumber(12.3456789), "12,345679");
assert.equal(formatBucketNumber(3), "3,00");
assert.deepEqual(mergeDefaultsById([{ id: "a", value: 1 }], [{ id: "a", value: 2 }, { id: "b", value: 3 }]), [{ id: "a", value: 1 }, { id: "b", value: 3 }]);
assert.deepEqual(normalizeNumberRecord({ a: 4.6, b: -2, c: 99, "": 3, bad: "x" }, 0, 10), { a: 5, b: 0, c: 10 });
assert.deepEqual(normalizeDecimalRecord({ a: 1.236, b: -1, c: 100 }, 0, 10, 2), { a: 1.24, b: 0, c: 10 });
assert.deepEqual(normalizeStringRecord({ a: " value ", b: "", c: 3 }), { a: "value" });
assert.deepEqual(normalizeStringList([" a ", "a", "", 5, "b"]), ["a", "b"]);
assert.deepEqual(normalizeStringListRecord({ " Уч_Аксу ": [" a ", "a", "", 5, "b"] }), { аксу: ["a", "b"] });
assert.equal(normalizeLookupValue("Уч_Аксу / Карьер"), "аксукарьер");
assert.equal(cleanAreaName("Уч_Акбакай"), "Акбакай");
assert.deepEqual(uniqueSorted(["Б", "А", "А", " "]), ["А", "Б"]);
assert.equal(createId().includes("-"), true);
assert.equal(
  errorToMessage("PTO data changed in database. Reload before saving inline edits."),
  "Данные ПТО в базе уже изменились другим пользователем. Обнови страницу перед повторным сохранением.",
);
assert.equal(
  errorToMessage("Could not find the table 'public.app_state' in the schema cache"),
  "В базе данных не найдена нужная таблица. Проверь структуру базы данных и повтори сохранение.",
);
assert.equal(formatDateInputValue(new Date(2026, 3, 5)), "2026-04-05");
assert.equal(isStoredReportDateValue("2026-04-05"), true);
assert.equal(isStoredReportDateValue("bad"), false);
assert.equal(resolveReportDateAreaContext("pto", "vehicles", "Все участки", "Уч_Аксу"), "Аксу");
const undoSource: UndoSnapshot = {
  reportCustomers: [...defaultReportCustomers],
  reportAreaOrder: ["Аксу"],
  reportWorkOrder: {},
  reportHeaderLabels: {},
  reportColumnWidths: {},
  reportReasons: {},
  areaShiftCutoffs: {},
  customTabs: [],
  topTabs: [...defaultTopTabs],
  subTabs: createDefaultSubTabs(["AA Mining"]),
  vehicleRows: [],
  ptoManualYears: ["2026"],
  expandedPtoMonths: {},
  ptoPlanRows: [...defaultPtoPlanRows],
  ptoSurveyRows: [...defaultPtoSurveyRows],
  ptoOperRows: [...defaultPtoOperRows],
  ptoColumnWidths: {},
  ptoRowHeights: {},
  ptoHeaderLabels: {},
  ptoBucketValues: {},
  ptoBucketManualRows: [],
  orgMembers: [...defaultOrgMembers],
  dependencyNodes: [...defaultDependencyNodes],
  dependencyLinks: [...defaultDependencyLinks],
};
const undoClone = cloneUndoSnapshot(undoSource);
assert.deepEqual(undoClone, undoSource);
assert.notEqual(undoClone, undoSource);
assert.notEqual(undoClone.reportCustomers, undoSource.reportCustomers);
assert.equal(clientSnapshotSaveDelayMs, 1500);
assert.equal(clientSnapshotAutoMinIntervalMs, 120000);
assert.equal(sharedAppSettingKeys.includes(adminStorageKeys.reportCustomers), true);
assert.equal(adminStorageKeys.vehicles, "dispatcher:vehicles");
assert.equal(ptoBucketRowKey("Уч_Аксу", "Подача"), "аксу:подача");
assert.equal(ptoBucketCellKey("row", "equipment"), "row::equipment");
assert.equal(ptoBucketSelectionKey({ rowKey: "row", equipmentKey: "equipment" }), "row::equipment");
assert.equal(normalizePtoBucketManualRows([{ area: "Уч_Аксу", structure: "Подача" }, { area: "Аксу", structure: "Подача" }]).length, 1);
assert.deepEqual(
  createPtoBucketRows(
    [{ area: "Уч_Аксу", structure: "Подача" }, { area: "Аксу", structure: "Подача" }],
    [{ key: ptoBucketRowKey("Акбакай", "Временная"), area: "Акбакай", structure: "Временная", source: "manual" }],
    "Все участки",
  ).map((row) => row.key),
  ["аксу:подача", "акбакай:временная"],
);
const ptoBucketRowsModel = createPtoBucketRowsModel(
  [{ area: "Aksu", structure: "Ore" }],
  [{ key: ptoBucketRowKey("Akbakai", "Temp"), area: "Akbakai", structure: "Temp", source: "manual" }],
  "Aksu",
);
assert.equal(ptoBucketRowsModel.rows.length, 1);
assert.equal(ptoBucketRowsModel.signature, ptoBucketRowsSignature(ptoBucketRowsModel.rows));
assert.deepEqual(
  createPtoBucketColumns([
    normalizeVehicleRow({ ...defaultVehicleForm, id: 9001, vehicleType: "Экскаватор", brand: "CAT", model: "390", name: "CAT 390" }),
    normalizeVehicleRow({ ...defaultVehicleForm, id: 9002, vehicleType: "Самосвал", brand: "Howo", model: "A7", name: "Howo A7" }),
  ]),
  [{ key: "cat390", label: "CAT 390" }],
);
assert.equal(normalizeAdminLogEntry({ action: "Удаление", section: "Техника", details: "Удалена строка" })?.action, "Удаление");
assert.equal(normalizeAdminLogEntry({ action: "bad" }), null);
assert.equal(adminLogLimit, 200);
assert.deepEqual(dateRange("2026-04-01", "2026-04-03"), ["2026-04-01", "2026-04-02", "2026-04-03"]);
assert.equal(nextDate("2026-04-30"), "2026-05-01");
assert.deepEqual(distributeMonthlyTotal(10, ["2026-04-01", "2026-04-02", "2026-04-03"]), { "2026-04-01": 3.334, "2026-04-02": 3.333, "2026-04-03": 3.333 });
assert.equal(ptoColumnDefaults.structure, 250);
assert.deepEqual(emptyPtoDraftRowFields, { customerCode: "", area: "", location: "", structure: "", unit: "" });
assert.equal(isPtoDateTableKey("plan"), true);
assert.equal(isPtoDateTableKey("buckets"), false);
assert.equal(ptoDateTableKeyFromTab("survey"), "survey");
assert.equal(ptoDateTableKeyFromTab("buckets"), null);
assert.equal(defaultReportDate, "2026-04-12");
assert.equal(defaultPtoPlanRows.length, 5);
assert.equal(defaultPtoSurveyRows.length, 5);
assert.equal(defaultPtoOperRows.length, 5);
assert.equal(defaultPtoPlanRows[0].dailyPlans[defaultReportDate], 2064);
assert.equal(defaultOrgMembers.length, 3);
assert.equal(adminSectionTabs.some((tab) => tab.value === "vehicles"), true);
assert.equal(structureSectionTabs.at(-1)?.value, "schedule");
assert.equal(defaultDependencyNodes.some((node) => node.id === "reports"), true);
assert.equal(defaultDependencyLinks.every((link) => defaultDependencyNodes.some((node) => node.id === link.fromNodeId) && defaultDependencyNodes.some((node) => node.id === link.toNodeId)), true);
assert.equal(dependencyStages.at(-1)?.nodeIds.includes("reports"), true);
assert.equal(orgMemberLabel(defaultOrgMembers[0]).includes(defaultOrgMembers[0].name), true);
assert.equal(dependencyNodeLabel(defaultDependencyNodes, "reports"), defaultDependencyNodes.find((node) => node.id === "reports")?.name);
assert.equal(defaultContractors["AA Mining"].length, 2);
assert.equal(defaultFuelGeneral[0].debt, 0);
assert.equal(defaultFuelContractors[0].contractor, "Qaz Trucks");
assert.equal(defaultUserCard.fullName, "Альберт");
const defaultSubTabs = createDefaultSubTabs(["AA Mining"]);
assert.equal(defaultSubTabs.contractors[0].value, "AA Mining");
assert.equal(normalizeStoredTopTabs([{ id: "admin", label: "", visible: false }]).find((tab) => tab.id === "admin")?.visible, true);
assert.equal(normalizeStoredSubTabs({ pto: [{ id: "custom", label: " Custom ", value: "", visible: true }] }, defaultSubTabs).pto.some((tab) => tab.id === "custom" && tab.label === "Custom"), true);
assert.equal(customTabKey("abc"), "custom:abc");
assert.equal(compactTopTabLabel(defaultTopTabs.find((tab) => tab.id === "dispatch")!), defaultTopTabs.find((tab) => tab.id === "dispatch")?.label);
assert.equal(compactSubTabLabel("pto", { id: "x", label: "Custom", value: "custom", visible: true }), "Custom");
assert.deepEqual(normalizeStoredCustomTabs([{ id: "c", title: " Custom ", description: " Text ", items: ["a", 1], visible: true }]), [{ id: "c", title: "Custom", description: "Text", items: ["a"], visible: true }]);

const defaultVehicle = {
  id: 0,
  name: "",
  brand: "",
  model: "",
  plateNumber: "",
  garageNumber: "",
  vehicleType: "",
  equipmentType: "",
  manufactureYear: "",
  fuelNormWinter: 0,
  fuelNormSummer: 0,
  fuelCalcType: "Моточасы" as const,
  vin: "",
  owner: "",
  area: "",
  location: "",
  workType: "",
  excavator: "",
  work: 0,
  rent: 0,
  repair: 0,
  downtime: 0,
  trips: 0,
  active: true,
  visible: true,
};
const seedVehicles = createDefaultVehicles([{ category: "Транспортировочная", equipmentType: "Самосвал", brand: "Howo", model: "371", plateNumber: "915FZ02", garageNumber: "P129", owner: "AA Mining" }], [defaultVehicle]);
assert.equal(createVehicleSeedVersion(seedVehicles.map((vehicle) => ({ category: vehicle.vehicleType, equipmentType: vehicle.equipmentType, brand: vehicle.brand, model: vehicle.model, plateNumber: vehicle.plateNumber, garageNumber: vehicle.garageNumber, owner: vehicle.owner }))), "excel-tech-list-1-2026-04-18");
assert.equal(seedVehicles[0].fuelCalcType, "Пробег");
assert.equal(seedVehicles[0].name, "Howo 371 - P129(915FZ02)");
assert.equal(isLoadingEquipment({ ...seedVehicles[0], vehicleType: "Экскаватор" }), true);
assert.equal(loadingEquipmentLabel({ brand: "Komatsu", model: "PC1250", name: "" }), "Komatsu PC1250");
assert.equal(defaultVehicleFallbackRows.length, 5);
assert.equal(createDefaultVehicles([])[0].name, defaultVehicleFallbackRows[0].name);
assert.equal(normalizeVehicleRow({ ...defaultVehicleForm, brand: "Toyota", model: "Hilux", garageNumber: "P1", plateNumber: "A1", equipmentType: "" }).equipmentType, "");
assert.deepEqual(vehicleInlineFields.slice(0, 3), ["vehicleType", "equipmentType", "brand"]);
assert.equal(adminVehicleFallbackPreviewRows >= adminVehicleMinPreviewRows, true);
assert.equal(adminVehicleViewportBottomReserve > 0, true);
assert.equal(vehicleAutocompleteFilterKeys.includes("owner"), true);
assert.equal(vehicleFilterColumnConfigs.find((column) => column.key === "manufactureYear")?.label, "Год выпуска");
assert.equal(vehicleInlineFieldDomKey(7, "brand"), "7:brand");
assert.deepEqual(parseVehicleInlineFieldDomKey("7:brand"), { vehicleId: 7, field: "brand" });
assert.equal(parseVehicleInlineFieldDomKey("bad:brand"), null);
assert.equal(vehicleFieldIsNumeric("manufactureYear"), true);
const importedVehicles = createVehiclesFromImportTable([
  ["Показ", "Категория техники", "Тип техники", "Марка", "Модель", "Госномер", "Гарномер", "Год выпуска", "VIN", "Собственник"],
  ["Скрыта", "Транспортировочная", "Самосвал", "Howo", "371", "915FZ02", "P129", "2020", "VIN-1", "AA Mining"],
], defaultVehicle);

assert.equal(importedVehicles.length, 1);
assert.equal(importedVehicles[0].visible, false);
assert.equal(importedVehicles[0].fuelCalcType, "Пробег");
assert.equal(buildVehicleDisplayName(importedVehicles[0]), "Howo 371 - P129(915FZ02)");
assert.deepEqual(createVehicleExportRows(importedVehicles)[1].slice(0, 3), ["Скрыта", "Транспортировочная", "Самосвал"]);
assert.deepEqual(createVehicleFilterOptions(importedVehicles, { getValue: (vehicle) => vehicle.owner }), ["AA Mining"]);
assert.deepEqual(mergeVehicleFilterOptions(["AA Mining"], [""]), ["", "AA Mining"]);
assert.deepEqual(
  createVehicleFilterOptionsForKey(
    importedVehicles,
    vehicleFilterColumnConfigs,
    createVehicleFilterSets({ visible: ["Скрыта"] }),
    "owner",
  ),
  ["AA Mining"],
);
assert.equal(
  vehicleMatchesFilters(importedVehicles[0], { owner: ["AA Mining"] }, [{ key: "owner", getValue: (vehicle) => vehicle.owner }]),
  true,
);

const importedPtoRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Вид работ", "Ед.", "Итого 04.2026"],
  ["Аксу", "Подача руды", "тн", "30"],
], "2026", []);
const importedPtoCustomerRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Заказчик", "Вид работ", "Ед.", "Итого 04.2026"],
  ["Аксу", "AAE", "Подача руды", "тн", "30"],
], "2026", []);
assert.equal(importedPtoRows.length, 1);
assert.equal(importedPtoRows[0].dailyPlans["2026-04-01"], 1);
assert.equal(importedPtoCustomerRows[0].customerCode, "AAE");
const mergeBasePtoRow = normalizePtoPlanRow({
  id: "merge-base",
  area: "Aksu",
  structure: "Ore haulage",
  unit: "tn",
  dailyPlans: {},
  years: ["2026"],
});
assert.equal(createPtoPlanExportRows(importedPtoRows, "2026", "Все участки")[1][1], "Аксу");
assert.equal(createPtoPlanExportRows(importedPtoCustomerRows, "2026", "Все участки")[0][0], "Заказчик");
assert.equal(createPtoPlanExportRows(importedPtoCustomerRows, "2026", "Все участки")[1][0], "AAE");
assert.equal(createPtoPlanExportRows(importedPtoCustomerRows, "2026", "Все участки", "oper")[0][1], "Вид работ");
assert.equal(mergeImportedPtoPlanRows([mergeBasePtoRow], importedPtoRows).length, 2);
assert.equal(ensureImportedRowsInLinkedPtoTable([], importedPtoRows, "2026")[0].id, importedPtoRows[0].id);
assert.equal(normalizePtoCustomerCode(" aae "), "AAE");
assert.equal(ptoDateTableMeta("oper").label, "Оперучет");
assert.equal(ptoDateExportFileName(ptoDateTableMeta("plan"), "2026", "Уч_Аксу"), "pto-plan-2026-Аксу.xlsx");

const dispatchVehicle = { ...defaultVehicle, id: 7, brand: "Howo", model: "371", garageNumber: "P129", plateNumber: "915FZ02", work: 2, trips: 3 };
const nightDispatch = createDispatchSummaryRow(dispatchVehicle, "2026-04-18", "night", "night");
const dayDispatch = { ...createDispatchSummaryRow(dispatchVehicle, "2026-04-18", "day", "day"), reason: "Ремонт (2 ч.)", downtimeHours: 2 };
const consolidatedDispatch = consolidateDispatchSummaryRows([nightDispatch, dayDispatch], "2026-04-18");

assert.equal(consolidatedDispatch.length, 1);
assert.equal(consolidatedDispatch[0].planVolume, 400);
assert.equal(consolidatedDispatch[0].trips, 6);
assert.equal(consolidatedDispatch[0].reason, "Ремонт (2 ч.)");
assert.equal(normalizeDispatchSummaryRows([{ id: "x", shift: "bad", planVolume: "12,5" }], "2026-04-18")?.[0].planVolume, 12.5);
assert.deepEqual(
  buildDispatchSummaryRowView({ ...dayDispatch, planVolume: 500, factVolume: 300, workHours: 6, rentHours: 1, repairHours: 2, downtimeHours: 2 }),
  { totalHours: 11, productivity: 50, delta: -200, hoursOk: true, isBehindPlan: true },
);
assert.equal(buildDispatchAiSuggestion([dayDispatch]).includes("простой 2 ч."), true);

console.log("Domain checks passed");
