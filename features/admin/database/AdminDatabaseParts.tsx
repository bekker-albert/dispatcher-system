import { Database, RotateCcw } from "lucide-react";
import { formatAdminLogDate } from "@/lib/domain/admin/logs";
import type { DataClientSnapshot } from "@/lib/data/app-state";
import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh } from "@/shared/ui/layout";
import {
  descriptionStyle,
  emptyCellStyle,
  headerActionsStyle,
  headerStyle,
  messageStyle,
  saveInfoStyle,
  saveInfoTextStyle,
  saveInfoTitleStyle,
  statusCardStyle,
  statusGridStyle,
  summaryLabelStyle,
  summaryNoteStyle,
  summaryValueStyle,
  tableScrollStyle,
  tableStyle,
  titleStyle,
} from "./AdminDatabaseStyles";
import type { ClientSnapshotStats, SnapshotStatsGetter } from "./AdminDatabaseTypes";

type AdminDatabaseHeaderProps = {
  loading: boolean;
  onCreateSnapshot: () => void;
  onRefreshSnapshots: () => void;
};

export function AdminDatabaseHeader({
  loading,
  onCreateSnapshot,
  onRefreshSnapshots,
}: AdminDatabaseHeaderProps) {
  return (
    <div style={headerStyle}>
      <div>
        <div style={titleStyle}>База и восстановление</div>
        <div style={descriptionStyle}>
          Здесь видны аварийные снимки браузеров. Они нужны, чтобы восстановить данные, если часть информации осталась только на старом компьютере.
        </div>
      </div>
      <div style={headerActionsStyle}>
        <IconButton label="Создать снимок этого браузера" onClick={onCreateSnapshot}>
          <Database size={16} aria-hidden />
        </IconButton>
        <IconButton label="Обновить список" onClick={onRefreshSnapshots} disabled={loading}>
          <RotateCcw size={16} aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}

type AdminDatabaseStatusCardProps = {
  databaseConfigured: boolean;
  databaseProviderLabel: string;
  ptoMemoryTotal: number;
  vehicleCount: number;
  snapshotsCount: number;
  message: string;
};

export function AdminDatabaseStatusCard({
  databaseConfigured,
  databaseProviderLabel,
  ptoMemoryTotal,
  vehicleCount,
  snapshotsCount,
  message,
}: AdminDatabaseStatusCardProps) {
  const saveModeTitle = databaseConfigured ? "Данные сохраняются на сервер" : "Данные сохраняются только в браузере";
  const saveModeText = databaseConfigured
    ? "ПТО, техника, настройки отчетности и общие данные отправляются в базу. Если сохранение не пройдет, сверху появится уведомление с причиной."
    : "База не настроена. Изменения видны только на этом компьютере и могут не появиться у других пользователей.";

  return (
    <div style={statusCardStyle}>
      <div style={statusGridStyle}>
        <StatusSummary label="База данных" note={databaseProviderLabel} value={databaseConfigured ? "Подключен" : "Не настроен"} />
        <StatusSummary label="ПТО в памяти" value={ptoMemoryTotal} />
        <StatusSummary label="Техника в памяти" value={vehicleCount} />
        <StatusSummary label="Снимки браузеров" value={snapshotsCount} />
      </div>
      {message ? <div style={messageStyle}>{message}</div> : null}
      <div style={saveInfoStyle}>
        <div style={saveInfoTitleStyle}>{saveModeTitle}</div>
        <div style={saveInfoTextStyle}>{saveModeText}</div>
      </div>
    </div>
  );
}

type StatusSummaryProps = {
  label: string;
  value: number | string;
  note?: string;
};

function StatusSummary({ label, value, note }: StatusSummaryProps) {
  return (
    <div>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={summaryValueStyle}>{value}</div>
      {note ? <div style={summaryNoteStyle}>{note}</div> : null}
    </div>
  );
}

type AdminDatabaseSnapshotsTableProps = {
  snapshots: DataClientSnapshot[];
  getSnapshotStats: SnapshotStatsGetter;
  onRestoreSnapshot: (snapshot: DataClientSnapshot) => void;
};

export function AdminDatabaseSnapshotsTable({
  snapshots,
  getSnapshotStats,
  onRestoreSnapshot,
}: AdminDatabaseSnapshotsTableProps) {
  return (
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
          {snapshots.map((snapshot) => (
            <SnapshotRow
              key={snapshot.key}
              snapshot={snapshot}
              stats={getSnapshotStats(snapshot)}
              onRestoreSnapshot={onRestoreSnapshot}
            />
          ))}
          {snapshots.length === 0 ? <EmptySnapshotsRow /> : null}
        </tbody>
      </table>
    </div>
  );
}

type SnapshotRowProps = {
  snapshot: DataClientSnapshot;
  stats: ClientSnapshotStats;
  onRestoreSnapshot: (snapshot: DataClientSnapshot) => void;
};

function SnapshotRow({ snapshot, stats, onRestoreSnapshot }: SnapshotRowProps) {
  return (
    <tr>
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
}

function EmptySnapshotsRow() {
  return (
    <tr>
      <td colSpan={5} style={emptyCellStyle}>
        Снимков пока нет. Открой сайт на компьютере, где остались нужные данные, затем обнови список.
      </td>
    </tr>
  );
}
