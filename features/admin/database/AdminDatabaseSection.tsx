"use client";

import { Database, RotateCcw } from "lucide-react";
import type { CSSProperties } from "react";
import { formatAdminLogDate } from "@/lib/domain/admin/logs";
import type { DataClientSnapshot } from "@/lib/data/app-state";
import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh } from "@/shared/ui/layout";

type ClientSnapshotStats = {
  appKeys: number;
  ptoRows: number;
  vehicles: number;
  bucketValues: number;
};

type AdminDatabaseSectionProps = {
  databaseConfigured: boolean;
  ptoMemoryTotal: number;
  vehicleCount: number;
  snapshots: DataClientSnapshot[];
  message: string;
  loading: boolean;
  getSnapshotStats: (snapshot: DataClientSnapshot) => ClientSnapshotStats;
  onCreateSnapshot: () => void;
  onRefreshSnapshots: () => void;
  onRestoreSnapshot: (snapshot: DataClientSnapshot) => void;
};

export default function AdminDatabaseSection({
  databaseConfigured,
  ptoMemoryTotal,
  vehicleCount,
  snapshots,
  message,
  loading,
  getSnapshotStats,
  onCreateSnapshot,
  onRefreshSnapshots,
  onRestoreSnapshot,
}: AdminDatabaseSectionProps) {
  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={{ fontWeight: 700 }}>База и восстановление</div>
          <div style={{ color: "#64748b", marginTop: 4 }}>
            Здесь видны аварийные снимки браузеров. Они нужны, чтобы восстановить данные, если часть информации осталась только на старом компьютере.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <IconButton label="Создать снимок этого браузера" onClick={onCreateSnapshot}>
            <Database size={16} aria-hidden />
          </IconButton>
          <IconButton label="Обновить список" onClick={onRefreshSnapshots} disabled={loading}>
            <RotateCcw size={16} aria-hidden />
          </IconButton>
        </div>
      </div>

      <div style={statusCardStyle}>
        <div style={statusGridStyle}>
          <div>
            <div style={summaryLabelStyle}>База данных</div>
            <div style={summaryValueStyle}>{databaseConfigured ? "Подключен" : "Не настроен"}</div>
          </div>
          <div>
            <div style={summaryLabelStyle}>ПТО в памяти</div>
            <div style={summaryValueStyle}>{ptoMemoryTotal}</div>
          </div>
          <div>
            <div style={summaryLabelStyle}>Техника в памяти</div>
            <div style={summaryValueStyle}>{vehicleCount}</div>
          </div>
          <div>
            <div style={summaryLabelStyle}>Снимки браузеров</div>
            <div style={summaryValueStyle}>{snapshots.length}</div>
          </div>
        </div>
        {message ? (
          <div style={{ color: "#475569", marginTop: 10, fontSize: 13 }}>{message}</div>
        ) : null}
      </div>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <CompactTh>Дата снимка</CompactTh>
              <CompactTh>Браузер</CompactTh>
              <CompactTh>Данные</CompactTh>
              <CompactTh>Источник</CompactTh>
              <CompactTh>{" "}</CompactTh>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((snapshot) => {
              const stats = getSnapshotStats(snapshot);

              return (
                <tr key={snapshot.key}>
                  <CompactTd>{formatAdminLogDate(snapshot.updatedAt ?? snapshot.savedAt ?? "")}</CompactTd>
                  <CompactTd>{snapshot.clientId}</CompactTd>
                  <CompactTd>
                    ПТО строк: {stats.ptoRows} · техника: {stats.vehicles} · ковши: {stats.bucketValues} · ключей: {stats.appKeys}
                  </CompactTd>
                  <CompactTd>{snapshot.meta.reason || "Снимок браузера"}</CompactTd>
                  <CompactTd>
                    <IconButton label="Восстановить этот снимок" onClick={() => onRestoreSnapshot(snapshot)}>
                      <RotateCcw size={16} aria-hidden />
                    </IconButton>
                  </CompactTd>
                </tr>
              );
            })}
            {snapshots.length === 0 ? (
              <tr>
                <td colSpan={5} style={emptyCellStyle}>Снимков пока нет. Открой сайт на компьютере, где остались нужные данные, затем обнови список.</td>
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

const statusCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
  marginBottom: 12,
};

const statusGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
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
