"use client";

import { Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { formatAdminLogDate, type AdminLogEntry } from "@/lib/domain/admin/logs";
import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh } from "@/shared/ui/layout";

type AdminLogsSectionProps = {
  logs: AdminLogEntry[];
  lastChangeLog?: AdminLogEntry;
  lastUploadLog?: AdminLogEntry;
  onClearLogs: () => void;
};

export default function AdminLogsSection({
  logs,
  lastChangeLog,
  lastUploadLog,
  onClearLogs,
}: AdminLogsSectionProps) {
  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={{ fontWeight: 700 }}>Логи админки</div>
          <div style={{ color: "#64748b", marginTop: 4 }}>История редактирования, загрузки и выгрузки таблиц.</div>
        </div>
        <IconButton label="Очистить логи" onClick={onClearLogs} disabled={logs.length === 0}>
          <Trash2 size={16} aria-hidden />
        </IconButton>
      </div>

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Последнее редактирование</div>
          {lastChangeLog ? (
            <>
              <div style={summaryValueStyle}>{formatAdminLogDate(lastChangeLog.at)}</div>
              <div style={summaryMetaStyle}>{lastChangeLog.section} · {lastChangeLog.user}</div>
              <div style={summaryDetailsStyle}>{lastChangeLog.details}</div>
            </>
          ) : (
            <div style={summaryEmptyStyle}>Редактирований пока нет.</div>
          )}
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryLabelStyle}>Последняя загрузка таблицы</div>
          {lastUploadLog ? (
            <>
              <div style={summaryValueStyle}>{formatAdminLogDate(lastUploadLog.at)}</div>
              <div style={summaryMetaStyle}>{lastUploadLog.fileName || "Файл не указан"} · {lastUploadLog.user}</div>
              <div style={summaryDetailsStyle}>{lastUploadLog.details}</div>
            </>
          ) : (
            <div style={summaryEmptyStyle}>Загрузок пока нет.</div>
          )}
        </div>
      </div>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <CompactTh>Дата и время</CompactTh>
              <CompactTh>Пользователь</CompactTh>
              <CompactTh>Раздел</CompactTh>
              <CompactTh>Действие</CompactTh>
              <CompactTh>Описание</CompactTh>
              <CompactTh>Файл / строки</CompactTh>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <CompactTd>{formatAdminLogDate(log.at)}</CompactTd>
                <CompactTd>{log.user}</CompactTd>
                <CompactTd>{log.section}</CompactTd>
                <CompactTd>{log.action}</CompactTd>
                <CompactTd>{log.details}</CompactTd>
                <CompactTd>{[log.fileName, log.rowsCount !== undefined ? `${log.rowsCount} строк` : ""].filter(Boolean).join(" · ") || "—"}</CompactTd>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCellStyle}>Логов пока нет. Новые изменения и загрузки будут появляться здесь автоматически.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
  marginBottom: 16,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 12,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 10,
  marginBottom: 12,
};

const summaryCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};

const summaryLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

const summaryValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 800,
};

const summaryMetaStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  marginTop: 4,
};

const summaryDetailsStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 13,
  marginTop: 8,
};

const summaryEmptyStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};

const tableScrollStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  fontSize: 13,
};

const emptyCellStyle: CSSProperties = {
  padding: "14px 10px",
  color: "#64748b",
  textAlign: "center",
};
