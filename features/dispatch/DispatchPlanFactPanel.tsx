"use client";

import { useMemo } from "react";

import { formatNumber, statusColor, statusTextColor } from "@/lib/domain/reports/display";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import { Pill } from "@/shared/ui/layout";
import {
  dispatchPlanFactCellStyle,
  dispatchPlanFactEmptyStyle,
  dispatchPlanFactHeaderStyle,
  dispatchPlanFactPanelStyle,
  dispatchPlanFactStructureCellStyle,
  dispatchPlanFactTableStyle,
} from "@/features/dispatch/dispatchSectionStyles";

type DispatchPlanFactPanelProps = {
  rows: DispatchSummaryRow[];
  dailyMode?: boolean;
  percent?: number;
};

type DispatchPlanFactRow = {
  area: string;
  location: string;
  structure: string;
  plan: number;
  fact: number;
  delta: number;
};

function createDispatchPlanFactRows(rows: DispatchSummaryRow[], dailyMode: boolean): DispatchPlanFactRow[] {
  const groups = new Map<string, { area: string; location: string; structure: string; plan: number; fact: number }>();

  rows.forEach((row) => {
    const area = row.area.trim() || "Без участка";
    const location = row.location.trim() || "Без местонахождения";
    const structure = row.workType.trim() || "Без структуры";
    const key = dailyMode ? `${area}\u001f${location}\u001f${structure}` : structure;
    const current = groups.get(key) ?? { area, location, structure, plan: 0, fact: 0 };
    current.plan += row.planVolume;
    current.fact += row.factVolume;
    groups.set(key, current);
  });

  return Array.from(groups.values())
    .map((value) => ({
      ...value,
      delta: value.fact - value.plan,
    }))
    .sort((left, right) => (
      left.area.localeCompare(right.area, "ru")
      || left.location.localeCompare(right.location, "ru")
      || left.structure.localeCompare(right.structure, "ru")
    ));
}

const dailyIdentityCellStyle = {
  ...dispatchPlanFactStructureCellStyle,
  width: "1%",
  whiteSpace: "nowrap",
} as const;

const dailyStructureCellStyle = {
  ...dispatchPlanFactStructureCellStyle,
  whiteSpace: "nowrap",
} as const;

const dailyNumberCellStyle = {
  ...dispatchPlanFactCellStyle,
  width: 96,
  minWidth: 96,
  maxWidth: 96,
  whiteSpace: "nowrap",
  textAlign: "right",
} as const;

export function DispatchPlanFactPanel({ rows, dailyMode = false, percent }: DispatchPlanFactPanelProps) {
  const planFactRows = useMemo(() => createDispatchPlanFactRows(rows, dailyMode), [dailyMode, rows]);

  return (
    <section
      style={{ ...dispatchPlanFactPanelStyle, width: "100%", boxSizing: "border-box", alignSelf: "stretch" }}
      aria-label="План факт по структурам работ"
    >
      <div style={dispatchPlanFactHeaderStyle}>
        <span>{dailyMode ? "Объемы: участок / местонахождение / структура" : "План / факт по структурам"}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{planFactRows.length} строк</span>
          {typeof percent === "number" ? (
            <Pill bg={statusColor(percent)} color={statusTextColor(percent)}>
              {percent}%
            </Pill>
          ) : null}
        </div>
      </div>
      {planFactRows.length > 0 ? (
        <table style={dailyMode ? { ...dispatchPlanFactTableStyle, tableLayout: "auto" } : dispatchPlanFactTableStyle}>
          {dailyMode ? (
            <colgroup>
              <col style={{ width: "1%" }} />
              <col style={{ width: "1%" }} />
              <col />
              <col style={{ width: 96 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 96 }} />
            </colgroup>
          ) : null}
          <thead>
            <tr>
              {dailyMode ? <th style={dailyIdentityCellStyle}>Участок</th> : null}
              {dailyMode ? <th style={dailyIdentityCellStyle}>Местонахождение</th> : null}
              <th style={dailyMode ? dailyStructureCellStyle : dispatchPlanFactStructureCellStyle}>{dailyMode ? "Структура" : ""}</th>
              <th style={dailyMode ? dailyNumberCellStyle : dispatchPlanFactCellStyle}>План</th>
              <th style={dailyMode ? dailyNumberCellStyle : dispatchPlanFactCellStyle}>Факт</th>
              <th style={dailyMode ? dailyNumberCellStyle : dispatchPlanFactCellStyle}>Отклонение</th>
            </tr>
          </thead>
          <tbody>
            {planFactRows.map((row) => (
              <tr key={`${row.area}:${row.location}:${row.structure}`}>
                {dailyMode ? <td style={dailyIdentityCellStyle}>{row.area}</td> : null}
                {dailyMode ? <td style={dailyIdentityCellStyle}>{row.location}</td> : null}
                <td style={dailyMode ? dailyStructureCellStyle : dispatchPlanFactStructureCellStyle}>{row.structure}</td>
                <td style={dailyMode ? dailyNumberCellStyle : dispatchPlanFactCellStyle}>{formatNumber(row.plan)}</td>
                <td style={dailyMode ? dailyNumberCellStyle : dispatchPlanFactCellStyle}>{formatNumber(row.fact)}</td>
                <td style={{ ...(dailyMode ? dailyNumberCellStyle : dispatchPlanFactCellStyle), color: row.delta < 0 ? "#991b1b" : "#166534" }}>
                  {formatNumber(row.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={dispatchPlanFactEmptyStyle}>
          Нет структур в плане для выбранного участка или еще нет строк День/Ночь.
        </div>
      )}
    </section>
  );
}
