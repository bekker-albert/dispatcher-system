"use client";

import { ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { reportRowDisplayKey } from "@/lib/domain/reports/display";
import type { ReportRow } from "@/lib/domain/reports/types";
import { MiniIconButton } from "@/shared/ui/buttons";

type AdminReportWorkOrderGroup = {
  area: string;
  rows: ReportRow[];
};

type AdminReportOrderSettingsProps = {
  areaOptions: string[];
  workOrderGroups: AdminReportWorkOrderGroup[];
  onMoveArea: (area: string, direction: -1 | 1) => void;
  onMoveWork: (area: string, rowKey: string, direction: -1 | 1) => void;
};

export default function AdminReportOrderSettings({
  areaOptions,
  workOrderGroups,
  onMoveArea,
  onMoveWork,
}: AdminReportOrderSettingsProps) {
  return (
    <div style={orderPanelStyle}>
      <div style={compactPanelStyle}>
        <div style={panelTitleStyle}>Порядок отображения участков в отчете заказчика</div>
        <div style={areaOrderListStyle}>
          {areaOptions.length === 0 ? (
            <div style={emptyTextStyle}>Участков пока нет.</div>
          ) : (
            areaOptions.map((area, index) => (
              <div key={area} style={areaOrderRowStyle}>
                <span style={areaOrderNameStyle}>{index + 1}. {area}</span>
                <div style={areaOrderActionsStyle}>
                  <MiniIconButton label="Поднять участок" onClick={() => onMoveArea(area, -1)} disabled={index === 0}>
                    <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} aria-hidden />
                  </MiniIconButton>
                  <MiniIconButton label="Опустить участок" onClick={() => onMoveArea(area, 1)} disabled={index === areaOptions.length - 1}>
                    <ChevronDown size={13} aria-hidden />
                  </MiniIconButton>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={workPanelStyle}>
        <div style={panelTitleStyle}>Порядок видов работ внутри участков</div>
        {workOrderGroups.length === 0 ? (
          <div style={emptyTextStyle}>Видов работ пока нет.</div>
        ) : (
          <div style={workGroupGridStyle}>
            {workOrderGroups.map((group) => (
              <div key={group.area} style={workGroupStyle}>
                <div style={workGroupTitleStyle}>{group.area}</div>
                <div style={areaOrderListStyle}>
                  {group.rows.map((row, index) => {
                    const rowKey = reportRowDisplayKey(row);
                    const isSummaryRow = rowKey.startsWith("summary:");

                    return (
                      <div key={rowKey} style={workOrderRowStyle}>
                        <span style={workOrderNameStyle}>
                          {index + 1}. {isSummaryRow ? "Итог: " : ""}{row.name}
                        </span>
                        <span style={workOrderUnitStyle}>{row.unit}</span>
                        <div style={areaOrderActionsStyle}>
                          <MiniIconButton label="Поднять вид работ" onClick={() => onMoveWork(group.area, rowKey, -1)} disabled={index === 0}>
                            <ChevronDown size={13} style={{ transform: "rotate(180deg)" }} aria-hidden />
                          </MiniIconButton>
                          <MiniIconButton label="Опустить вид работ" onClick={() => onMoveWork(group.area, rowKey, 1)} disabled={index === group.rows.length - 1}>
                            <ChevronDown size={13} aria-hidden />
                          </MiniIconButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const compactPanelStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  width: "100%",
  boxSizing: "border-box",
};

const panelTitleStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
};

const areaOrderListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const areaOrderRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(170px, 260px) auto",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "6px 8px",
};

const areaOrderNameStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 13,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const areaOrderActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const orderPanelStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 360px) minmax(560px, 1fr)",
  gap: 12,
  width: "min(100%, 1180px)",
  alignItems: "start",
};

const workPanelStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const workGroupGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 8,
};

const workGroupStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 8,
};

const workGroupTitleStyle: CSSProperties = {
  fontWeight: 800,
  marginBottom: 8,
};

const workOrderRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) 44px auto",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: "6px 8px",
};

const workOrderNameStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 13,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const workOrderUnitStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  textAlign: "center",
};

const emptyTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
};
