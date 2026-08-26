import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const ptoPrimary = read("features/app/PtoPrimaryContent.tsx");
const reportsPrimary = read("features/app/ReportsPrimaryContent.tsx");
const workspaceTabs = read("features/reports/PlanFactWorkspaceTabs.tsx");
const reportHeader = read("features/reports/ReportEditableHeaderText.tsx");
const ptoFacts = read("lib/domain/reports/pto-facts.ts");

assert.match(ptoPrimary, /<PlanFactWorkspaceTabs/);
assert.match(reportsPrimary, /<PlanFactWorkspaceTabs/);
assert.match(workspaceTabs, /План/);
assert.match(workspaceTabs, /Опер учет/);
assert.match(workspaceTabs, /Марк замер/);
assert.match(workspaceTabs, /ААМ/);
assert.match(workspaceTabs, /ААЕ/);
assert.match(workspaceTabs, /Завершить редактирование/);
assert.match(workspaceTabs, /Добавить отчет/);
assert.match(reportHeader, /if \(!editable\)/);
assert.match(ptoFacts, /surveyHasDayFact/);
assert.match(ptoFacts, /surveyHasDayFact\s*\?\s*daySurveyFact/);

console.log("plan/fact workspace source checks passed");
