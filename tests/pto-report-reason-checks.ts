import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dateRange, nextDate, normalizePtoPlanRow } from "../lib/domain/pto/date-table";
import { buildReportPtoIndex, createReportRowFromPtoPlan, deriveReportRowFromPtoIndex } from "../lib/domain/reports/calculation";
import { reportYearFact } from "../lib/domain/reports/facts";
import { reportReasonAccumulationStartDate, reportReasonAccumulationStartDateFromIndexes } from "../lib/domain/reports/reason-accumulation";
import {
  aggregateReportReasons,
  createReportReasonIndex,
  reportReasonEmptyOverride,
  reportReasonEntryKey,
  reportYearReasonOverrideKey,
  reportYearReasonValue,
  reportYearReasonValueFromIndex,
} from "../lib/domain/reports/reasons";

const testDir = dirname(fileURLToPath(import.meta.url));
const nbsp = "\u00a0";

const reportReasonDraftsSource = readFileSync(resolve(testDir, "../features/reports/useReportReasonDrafts.ts"), "utf8");
const reportReasonTextareaSource = readFileSync(resolve(testDir, "../features/reports/ReportReasonTextarea.tsx"), "utf8");
const reportReasonTextareaAutosizeSource = readFileSync(resolve(testDir, "../features/reports/useReportReasonTextareaAutosize.ts"), "utf8");
const reportPrintMediaTextSectionsSource = readFileSync(resolve(testDir, "../features/reports/reportPrintMediaTextSections.ts"), "utf8");
assert.match(reportReasonDraftsSource, /export function useReportReasonDrafts/);
assert.doesNotMatch(reportReasonDraftsSource, /updateReport(?:Day|Year)ReasonDraft/);
assert.doesNotMatch(reportReasonDraftsSource, /draft(?:Save)?Timer/i);
assert.doesNotMatch(reportReasonDraftsSource, /clearTimeout/);
assert.equal((reportReasonDraftsSource.match(/window\.setTimeout\(requestSave,\s*0\)/g) ?? []).length, 2);
assert.match(reportReasonDraftsSource, /function commitReportDayReason[\s\S]*upsertReason\(reportReasonEntryKey\(reportDate,\s*rowKey\),\s*value\);[\s\S]*window\.setTimeout\(requestSave,\s*0\);/);
assert.match(reportReasonDraftsSource, /function commitReportYearReason[\s\S]*upsertReason\(reportYearReasonOverrideKey\(reportDate,\s*rowKey\),\s*value,\s*true,\s*reportReasonEmptyOverride\);[\s\S]*window\.setTimeout\(requestSave,\s*0\);/);
assert.match(reportReasonDraftsSource, /Esc is a local cancel only/);
assert.match(reportReasonTextareaSource, /className="report-reason-print-value"/);
assert.match(reportReasonTextareaSource, /useReportReasonTextareaAutosize\(textareaRef\)/);
assert.match(reportReasonTextareaSource, /scheduleHeightSync\(\)/);
assert.match(reportReasonTextareaSource, /scheduleFrame\(\(\) => setDraft\(value\)\)/);
assert.doesNotMatch(reportReasonTextareaSource, /requestAnimationFrame/);
assert.match(reportReasonTextareaAutosizeSource, /const resizeFrameRef = useRef<number \| null>\(null\);/);
assert.match(reportReasonTextareaAutosizeSource, /const scheduleFrame = useCallback\(\(callback: \(\) => void\) => \{/);
assert.match(reportReasonTextareaAutosizeSource, /window\.requestAnimationFrame/);
assert.match(reportReasonTextareaAutosizeSource, /window\.cancelAnimationFrame\(resizeFrameRef\.current\)/);
assert.match(reportPrintMediaTextSectionsSource, /\.report-reason-input \{[\s\S]*display: none !important;/);
assert.match(reportPrintMediaTextSectionsSource, /\.report-reason-print-value \{[\s\S]*display: block !important;/);

assert.equal(
  aggregateReportReasons(["В связи с отсутствием ГСМ (22 ч.)"]),
  `В связи с отсутствием ГСМ${nbsp}(22${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["В связи с отсутствием ГСМ (22 ч.,"]),
  `В связи с отсутствием ГСМ${nbsp}(22${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["Неблагоприятные погодные условия\n(дождь, снег, метель - 10 ч.)"]),
  `Погодные условия${nbsp}(10${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["Простой ДСК (5 ч.)", "Простой ДСК (3 ч.)"]),
  `Простой ДСК${nbsp}(8${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["Ремонт транспортировочной техники:\n1 ед. самосвала (6 ч.)"]),
  `Ремонт транспортировочной техники${nbsp}(6${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons([
    "Ремонт транспортировочной техники:\n1 ед. самосвала (6 ч.)\nНеблагоприятные погодные условия\n(дождь, снег - 10 ч.)",
    "Ремонт транспортировочной техники:\n1 ед. самосвала (3 ч.)",
  ]),
  `Ремонт транспортировочной техники${nbsp}(9${nbsp}ч.)\nПогодные условия${nbsp}(10${nbsp}ч.)`,
);

const reasonRowKey = "аксу::отсыпка";
const reasonMap = {
  [reportReasonEntryKey("2026-04-17", reasonRowKey)]: "Ремонт транспортировочной техники:\n1 ед. самосвала (6 ч.)",
  [reportReasonEntryKey("2026-04-18", reasonRowKey)]: "Неблагоприятные погодные условия\n(дождь - 10 ч.)",
  [`year:2026-04-18||${reasonRowKey}`]: `Ремонт транспортировочной техники${nbsp}(6${nbsp}ч.)`,
};

assert.equal(
  reportYearReasonValue(reasonMap, reasonRowKey, "2026-04-18", "", "2026-01-01"),
  `Ремонт транспортировочной техники${nbsp}(6${nbsp}ч.)\nПогодные условия${nbsp}(10${nbsp}ч.)`,
);
assert.equal(
  reportYearReasonValueFromIndex(reasonMap, createReportReasonIndex(reasonMap), reasonRowKey, "2026-04-18", "", "2026-01-01"),
  reportYearReasonValue(reasonMap, reasonRowKey, "2026-04-18", "", "2026-01-01"),
);
assert.equal(
  reportYearReasonValue({
    ...reasonMap,
    [reportYearReasonOverrideKey("2026-04-18", reasonRowKey)]: reportReasonEmptyOverride,
  }, reasonRowKey, "2026-04-18", "", "2026-01-01"),
  "",
);

const accumulationPlanRow = normalizePtoPlanRow({
  id: "plan-accumulation",
  area: "Aksu",
  structure: "Accumulation",
  customerCode: "AA",
  unit: "m3",
  dailyPlans: {
    "2026-01-01": 10,
    "2026-01-02": 10,
    "2026-01-03": 10,
    "2026-01-04": 10,
  },
  years: ["2026"],
});
const accumulationSurveyRow = normalizePtoPlanRow({
  id: "survey-accumulation",
  area: "Aksu",
  structure: "Accumulation",
  unit: "m3",
  dailyPlans: { "2026-01-03": 25 },
  years: ["2026"],
});
const accumulationOperRow = normalizePtoPlanRow({
  id: "oper-accumulation",
  area: "Aksu",
  structure: "Accumulation",
  unit: "m3",
  dailyPlans: {
    "2026-01-01": 12,
    "2026-01-03": 100,
    "2026-01-04": 20,
  },
  years: ["2026"],
});
const accumulationReportRow = createReportRowFromPtoPlan(accumulationPlanRow);
const accumulationPlanIndex = buildReportPtoIndex([accumulationPlanRow], { includeCustomerCode: true });
const accumulationSurveyIndex = buildReportPtoIndex([accumulationSurveyRow]);
const accumulationOperIndex = buildReportPtoIndex([accumulationOperRow]);
let legacyAccumulationStartDate = "2026-01-01";

dateRange("2026-01-01", "2026-01-04").forEach((date) => {
  const reportAtDate = deriveReportRowFromPtoIndex(
    accumulationReportRow,
    date,
    accumulationPlanIndex,
    accumulationSurveyIndex,
    accumulationOperIndex,
  );
  const yearDelta = reportYearFact(reportAtDate) - reportAtDate.yearPlan;

  if (yearDelta >= 0) {
    legacyAccumulationStartDate = nextDate(date);
  }
});

assert.equal(legacyAccumulationStartDate, "2026-01-05");
assert.equal(
  reportReasonAccumulationStartDateFromIndexes(
    accumulationReportRow,
    "2026-01-04",
    accumulationPlanIndex,
    accumulationSurveyIndex,
    accumulationOperIndex,
  ),
  legacyAccumulationStartDate,
);
assert.equal(
  reportReasonAccumulationStartDate(
    accumulationReportRow,
    "2026-01-04",
    [accumulationPlanRow],
    [accumulationSurveyRow],
    [accumulationOperRow],
  ),
  legacyAccumulationStartDate,
);
