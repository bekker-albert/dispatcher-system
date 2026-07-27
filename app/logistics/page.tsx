import type { Metadata } from "next";
import LogisticsWorkspace from "@/features/logistics/LogisticsWorkspace";

export const metadata: Metadata = {
  title: "Логистика Газели",
  description: "Веб-система заявок, согласований, командировок и документов",
};

export default function LogisticsPage() {
  return (
    <>
      <a
        href="/admin"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 150,
          padding: "11px 15px",
          borderRadius: 10,
          background: "#0e6574",
          color: "#fff",
          textDecoration: "none",
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
          boxShadow: "0 10px 30px rgba(0,0,0,.22)",
        }}
      >
        Расширенная админка
      </a>
      <LogisticsWorkspace />
    </>
  );
}
