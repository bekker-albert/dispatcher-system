export type PtoPlanRow = {
  id: string;
  area: string;
  location: string;
  structure: string;
  customerCode?: string;
  unit: string;
  status: string;
  carryover: number;
  carryovers?: Record<string, number>;
  carryoverManualYears?: string[];
  dailyPlans: Record<string, number>;
  years?: string[];
};

export type PtoStatus = string;

export type PtoDateTableKey = "plan" | "oper" | "survey";
export type PtoDropPosition = "before" | "after";
export type PtoDraftRowFields = {
  customerCode: string;
  area: string;
  location: string;
  structure: string;
  unit: string;
};

export const defaultPtoPlanMonth = "2026-04";
export const ptoDateTableKeys = ["plan", "oper", "survey"] as const;
export const emptyPtoDraftRowFields: PtoDraftRowFields = {
  customerCode: "",
  area: "",
  location: "",
  structure: "",
  unit: "",
};

export const ptoColumnDefaults = {
  area: 138,
  location: 150,
  structure: 250,
  customerCode: 88,
  unit: 58,
  status: 118,
  carryover: 110,
  yearTotal: 118,
  monthTotal: 104,
  day: 86,
};

export const ptoUnitOptions = ["\u043c2", "\u043c3", "\u0442\u043d"] as const;
export const ptoCustomerCodeOptions = [
  { code: "AAM", label: "\u0422\u041e\u041e AA Mining", customerId: "aa-mining" },
  { code: "AA", label: "\u0410\u041e \u0410\u041a \u0410\u043b\u0442\u044b\u043d\u0430\u043b\u043c\u0430\u0441", customerId: "ak-altynalmas" },
  { code: "AAE", label: "\u0422\u041e\u041e AA Engineering", customerId: "aa-engineering" },
] as const;
