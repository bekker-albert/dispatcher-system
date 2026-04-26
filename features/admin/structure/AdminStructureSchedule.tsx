import type { CSSProperties } from "react";

import { CompactTh } from "@/shared/ui/layout";
import {
  defaultAreaShiftScheduleArea,
  resolveAreaShiftCutoffTime,
  type AreaShiftCutoffMap,
} from "@/lib/domain/admin/area-schedule";
import { normalizeLookupValue } from "@/lib/utils/text";

type AdminStructureScheduleProps = {
  areas: string[];
  areaShiftCutoffs: AreaShiftCutoffMap;
  onUpdateAreaShiftCutoff: (area: string, value: string) => void;
};

export function AdminStructureSchedule({
  areas,
  areaShiftCutoffs,
  onUpdateAreaShiftCutoff,
}: AdminStructureScheduleProps) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Распорядок участков</div>
      <div style={{ color: "#64748b", marginBottom: 12 }}>
        Здесь задается время закрытия рабочих суток. Если текущее время меньше границы участка, Рабочая дата
        автоматически считается предыдущим календарным днем.
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <CompactTh>Участок</CompactTh>
              <CompactTh>Граница суток</CompactTh>
              <CompactTh>Правило расчета</CompactTh>
              <CompactTh>Источник</CompactTh>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => {
              const cutoffTime = resolveAreaShiftCutoffTime(areaShiftCutoffs, area);
              const hasOwnCutoff = Object.prototype.hasOwnProperty.call(areaShiftCutoffs, area);
              const isDefaultArea =
                normalizeLookupValue(area) === normalizeLookupValue(defaultAreaShiftScheduleArea);

              return (
                <tr key={area}>
                  <td style={areaCellStyle}>
                    <div style={primaryTextStyle}>{area}</div>
                    {!isDefaultArea ? (
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                        Если время не задано отдельно, используется общее правило.
                      </div>
                    ) : null}
                  </td>
                  <td style={timeCellStyle}>
                    <input
                      type="time"
                      step={60}
                      value={cutoffTime}
                      onChange={(event) => onUpdateAreaShiftCutoff(area, event.target.value)}
                      style={timeInputStyle}
                    />
                  </td>
                  <td style={bodyCellStyle}>
                    С {cutoffTime} предыдущего календарного дня до {cutoffTime} текущего календарного дня.
                  </td>
                  <td style={sourceCellStyle}>
                    {isDefaultArea ? "Общее правило" : hasOwnCutoff ? "Индивидуально" : "Общее правило"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#ffffff",
  marginBottom: 16,
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 860,
  borderCollapse: "collapse",
  fontSize: 14,
};

const bodyCellStyle: CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const areaCellStyle: CSSProperties = {
  ...bodyCellStyle,
};

const timeCellStyle: CSSProperties = {
  ...bodyCellStyle,
  width: 180,
};

const sourceCellStyle: CSSProperties = {
  ...bodyCellStyle,
  color: "#475569",
};

const primaryTextStyle: CSSProperties = {
  fontWeight: 700,
  color: "#0f172a",
};

const timeInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 120,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};
