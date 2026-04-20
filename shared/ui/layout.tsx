import type { CSSProperties, ReactNode } from "react";

export function SectionCard({ title, children, fill = false }: { title: string; children: ReactNode; fill?: boolean }) {
  return (
    <div style={{ ...sectionCardStyle, ...(fill ? sectionCardFillStyle : null) }}>
      {title ? <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{title}</div> : null}
      {children}
    </div>
  );
}

export function SubTabs({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function SourceNote({ title, source, text }: { title: string; source: string; text: string }) {
  return (
    <div style={sourceNoteStyle}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#0f172a", marginTop: 4 }}>{source}</div>
      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{text}</div>
    </div>
  );
}

export function Pill({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return <span style={{ padding: "6px 10px", borderRadius: 999, background: bg, color, fontWeight: 700, display: "inline-block" }}>{children}</span>;
}

export function VehicleMeta({ label, value }: { label: string; value: ReactNode }) {
  const renderedValue = value === "" || value === null || value === undefined ? "—" : value;

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "baseline", minHeight: 20 }}>
      <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700, overflowWrap: "normal", wordBreak: "normal", hyphens: "none" }}>{renderedValue}</span>
    </div>
  );
}

export function CompactTh({ children }: { children: ReactNode }) {
  return <th style={{ padding: "8px 10px", borderBottom: "1px solid #cbd5e1", whiteSpace: "normal", overflowWrap: "normal", wordBreak: "normal", hyphens: "none" }}>{children}</th>;
}

export function CompactTd({ children }: { children: ReactNode }) {
  return <td style={{ padding: "8px 10px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>{children}</td>;
}

const sectionCardStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
  marginBottom: 20,
};

const sectionCardFillStyle: CSSProperties = {
  minHeight: 0,
  height: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  marginBottom: 0,
};

const sourceNoteStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 10,
  minHeight: 92,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const fieldLabelStyle: CSSProperties = {
  color: "#475569",
  fontSize: 13,
  fontWeight: 700,
};
