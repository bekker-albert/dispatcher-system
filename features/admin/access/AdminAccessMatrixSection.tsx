"use client";

import { ShieldCheck, TableProperties, UserCheck } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import {
  accessCapabilityLabels,
  dispatchServiceRoles,
  workspaceAccessMatrixPreview,
} from "@/lib/domain/access-control/accessMatrix";

export function AdminAccessMatrixSection() {
  return (
    <div style={sectionStyle}>
      <div style={introStyle}>
        <div>
          <div style={eyebrowStyle}>Архитектурный каркас</div>
          <h1 style={titleStyle}>Матрица доступа диспетчерской службы</h1>
          <p style={leadStyle}>
            Этот экран пока не меняет текущую авторизацию. Он фиксирует будущую модель user/role/section/workspace
            с правами просмотра, редактирования, согласования, удаления, экспорта и администрирования.
          </p>
        </div>
        <div style={metricsStyle}>
          <Metric icon={<UserCheck size={18} aria-hidden />} label="Ролей" value={String(dispatchServiceRoles.length)} />
          <Metric icon={<TableProperties size={18} aria-hidden />} label="Зон" value={String(workspaceAccessMatrixPreview.length)} />
          <Metric icon={<ShieldCheck size={18} aria-hidden />} label="Прав" value={String(Object.keys(accessCapabilityLabels).length)} />
        </div>
      </div>

      <div style={capabilityBarStyle}>
        {Object.values(accessCapabilityLabels).map((label) => (
          <span key={label} style={capabilityPillStyle}>{label}</span>
        ))}
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Рабочая зона</th>
              <th style={thStyle}>Просмотр по умолчанию</th>
              <th style={thStyle}>Редактирование по умолчанию</th>
              <th style={thStyle}>Ограничения выборок</th>
              <th style={thStyle}>Участок</th>
            </tr>
          </thead>
          <tbody>
            {workspaceAccessMatrixPreview.map((row) => (
              <tr key={row.workspaceId}>
                <td style={tdStrongStyle}>{row.title}</td>
                <td style={tdStyle}>{formatRoles(row.defaultViewRoles)}</td>
                <td style={tdStyle}>{formatRoles(row.defaultEditRoles)}</td>
                <td style={tdStyle}>{row.requiredServerFilters.join(", ") || "без тяжелой выборки"}</td>
                <td style={tdStyle}>{row.controlledBySection ? "учитывается section_id" : "общий доступ"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={noteStyle}>
        Реальная реализация должна сохранять только измененные гранты доступа, проверять version и писать
        историю изменений. Существующая tab-permissions логика остается рабочей основой до подключения
        серверной матрицы.
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={metricStyle}>
      <span style={metricIconStyle}>{icon}</span>
      <span>
        <span style={metricValueStyle}>{value}</span>
        <span style={metricLabelStyle}>{label}</span>
      </span>
    </div>
  );
}

function formatRoles(roleIds: string[]) {
  return roleIds
    .map((id) => dispatchServiceRoles.find((role) => role.id === id)?.label ?? id)
    .join(", ");
}

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const introStyle: CSSProperties = {
  alignItems: "start",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 14,
  gridTemplateColumns: "minmax(280px, 1fr) minmax(220px, 360px)",
  padding: 14,
};

const eyebrowStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 4,
};

const titleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 22,
  lineHeight: 1.2,
  margin: 0,
};

const leadStyle: CSSProperties = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.45,
  margin: "8px 0 0",
  maxWidth: 900,
};

const metricsStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const metricStyle: CSSProperties = {
  alignItems: "center",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 8,
  gridTemplateColumns: "auto minmax(0, 1fr)",
  minHeight: 48,
  padding: 10,
};

const metricIconStyle: CSSProperties = {
  alignItems: "center",
  background: "#ecfeff",
  borderRadius: 8,
  color: "#0e7490",
  display: "inline-flex",
  height: 32,
  justifyContent: "center",
  width: 32,
};

const metricValueStyle: CSSProperties = {
  color: "#0f172a",
  display: "block",
  fontSize: 15,
  fontWeight: 900,
  lineHeight: 1.15,
};

const metricLabelStyle: CSSProperties = {
  color: "#64748b",
  display: "block",
  fontSize: 12,
  fontWeight: 700,
};

const capabilityBarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const capabilityPillStyle: CSSProperties = {
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  color: "#334155",
  fontSize: 12,
  fontWeight: 800,
  padding: "6px 8px",
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  fontSize: 13,
  minWidth: 940,
  width: "100%",
};

const thStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontWeight: 900,
  padding: "9px 10px",
  textAlign: "left",
};

const tdStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  color: "#475569",
  lineHeight: 1.35,
  padding: "9px 10px",
  verticalAlign: "top",
};

const tdStrongStyle: CSSProperties = {
  ...tdStyle,
  color: "#0f172a",
  fontWeight: 900,
};

const noteStyle: CSSProperties = {
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
  color: "#78350f",
  fontSize: 13,
  lineHeight: 1.45,
  padding: 12,
};
