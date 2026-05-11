"use client";

import { useMemo } from "react";

import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";
import { formatNumber } from "@/lib/domain/reports/display";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
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
};

type DispatchPlanFactRow = {
  area: string;
  location: string;
  structure: string;
  plan: number;
  fact: number;
  delta: number;
  percent: number;
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
    .map((value) => {
      const delta = value.fact - value.plan;
      const percent = value.plan > 0 ? Math.round((value.fact / value.plan) * 100) : value.fact > 0 ? 100 : 0;
      return {
        ...value,
        delta,
        percent,
      };
    })
    .sort((left, right) => (
      left.area.localeCompare(right.area, "ru")
      || left.location.localeCompare(right.location, "ru")
      || left.structure.localeCompare(right.structure, "ru")
    ));
}

export function DispatchPlanFactPanel({ rows, dailyMode = false }: DispatchPlanFactPanelProps) {
  const planFactRows = useMemo(() => createDispatchPlanFactRows(rows, dailyMode), [dailyMode, rows]);

  return (
    <section style={dispatchPlanFactPanelStyle} aria-label="План факт по структурам работ">
      <div style={dispatchPlanFactHeaderStyle}>
        <span>{dailyMode ? "Объемы: участок / местонахождение / структура" : "План / факт по структурам"}</span>
        <span>{planFactRows.length} строк</span>
      </div>
      {planFactRows.length > 0 ? (
        <table style={dispatchPlanFactTableStyle}>
          <thead>
            <tr>
              {dailyMode ? <th style={dispatchPlanFactStructureCellStyle}>Участок</th> : null}
              {dailyMode ? <th style={dispatchPlanFactStructureCellStyle}>Местонахождение</th> : null}
              <th style={dispatchPlanFactStructureCellStyle}>Структура</th>
              <th style={dispatchPlanFactCellStyle}>План</th>
              <th style={dispatchPlanFactCellStyle}>Факт</th>
              <th style={dispatchPlanFactCellStyle}>Отклонение</th>
              <th style={dispatchPlanFactCellStyle}>%</th>
            </tr>
          </thead>
          <tbody>
            {planFactRows.map((row) => (
              <tr key={`${row.area}:${row.location}:${row.structure}`}>
                {dailyMode ? <td style={dispatchPlanFactStructureCellStyle}>{row.area}</td> : null}
                {dailyMode ? <td style={dispatchPlanFactStructureCellStyle}>{row.location}</td> : null}
                <td style={dispatchPlanFactStructureCellStyle}>{row.structure}</td>
                <td style={dispatchPlanFactCellStyle}>{formatNumber(row.plan)}</td>
                <td style={dispatchPlanFactCellStyle}>{formatNumber(row.fact)}</td>
                <td style={{ ...dispatchPlanFactCellStyle, color: row.delta < 0 ? "#991b1b" : "#166534" }}>
                  {formatNumber(row.delta)}
                </td>
                <td style={dispatchPlanFactCellStyle}>{formatPtoCellNumber(row.percent)}%</td>
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
