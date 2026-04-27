import type { CSSProperties } from "react";
import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";

export function AdminReportSettingsTabs({
  settingsTab,
  usesSummaryRows,
  onSetSettingsTab,
}: {
  settingsTab: AdminReportCustomerSettingsTab;
  usesSummaryRows: boolean;
  onSetSettingsTab: (tab: AdminReportCustomerSettingsTab) => void;
}) {
  return (
    <div style={settingsTabsStyle}>
      <AdminReportSettingsButton active={settingsTab === "order"} onClick={() => onSetSettingsTab("order")} label="Порядок" />
      <AdminReportSettingsButton active={settingsTab === "display"} onClick={() => onSetSettingsTab("display")} label="Отображение" />
      <AdminReportSettingsButton active={settingsTab === "rename"} onClick={() => onSetSettingsTab("rename")} label="Переименование строк" />
      <AdminReportSettingsButton
        active={settingsTab === "summary"}
        disabled={!usesSummaryRows}
        onClick={() => onSetSettingsTab("summary")}
        label="Итоговые строки"
      />
    </div>
  );
}

function AdminReportSettingsButton({ active, onClick, label, disabled = false }: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (disabled) return;
        onClick();
        event.currentTarget.blur();
      }}
      style={{
        ...settingsTabStyle,
        ...(active ? settingsTabActiveStyle : null),
        ...(disabled ? settingsTabDisabledStyle : null),
      }}
    >
      {label}
    </button>
  );
}

const settingsTabsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  width: "100%",
  maxWidth: "100%",
};

const settingsTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  outline: "none",
  padding: "6px 9px",
  userSelect: "none",
};

const settingsTabActiveStyle: CSSProperties = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const settingsTabDisabledStyle: CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.45,
};
