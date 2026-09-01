import type { CSSProperties } from "react";
import type { Metadata } from "next";
import ServerLogisticsWorkspace from "@/features/logistics/ServerLogisticsWorkspace";

export const metadata: Metadata = {
  title: "Логистика Газели",
  description: "Серверная система заявок, согласований, рейсов, документов и аудита",
};

const quickLink: CSSProperties = {
  padding: "11px 15px",
  borderRadius: 10,
  color: "#fff",
  textDecoration: "none",
  fontFamily: "Arial, sans-serif",
  fontWeight: 700,
  boxShadow: "0 10px 30px rgba(0,0,0,.22)",
};

export default function LogisticsPage() {
  return (
    <>
      <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 150, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <a href="/logistics/documents" style={{ ...quickLink, background: "#725315" }}>
          Документы и шаблоны
        </a>
        <a href="/logistics/release" style={{ ...quickLink, background: "#1f7a46" }}>
          Медицинский и технический выпуск
        </a>
      </div>
      <ServerLogisticsWorkspace />
    </>
  );
}
