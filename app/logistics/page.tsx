import type { Metadata } from "next";
import ServerLogisticsWorkspace from "@/features/logistics/ServerLogisticsWorkspace";

export const metadata: Metadata = {
  title: "Логистика Газели",
  description: "Серверная система заявок, согласований, рейсов, документов и аудита",
};

export default function LogisticsPage() {
  return (
    <>
      <a
        href="/logistics/release"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 150,
          padding: "11px 15px",
          borderRadius: 10,
          background: "#1f7a46",
          color: "#fff",
          textDecoration: "none",
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
          boxShadow: "0 10px 30px rgba(0,0,0,.22)",
        }}
      >
        Медицинский и технический выпуск
      </a>
      <ServerLogisticsWorkspace />
    </>
  );
}
