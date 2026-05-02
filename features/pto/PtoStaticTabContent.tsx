import type { CSSProperties } from "react";

const ptoStaticTabFallbackContent: Record<string, string> = {
  bodies: "Справочник объемов кузовов: модель техники -> материал -> объем кузова.",
  performance: "Расчет производительности: рейсы, кузова, материалы, удельный вес, перевод м3 <-> тн.",
  cycle: "Цикл погрузки: подъезд, погрузка, выезд, разгрузка, обратный путь.",
};

const customPtoTabFallbackContent = "В этой подвкладке пока нет информации.";

export function PtoStaticTabContent({
  content,
  ptoTab,
}: {
  content: string;
  ptoTab: string;
}) {
  const fallbackContent = ptoTab.startsWith("custom:")
    ? customPtoTabFallbackContent
    : ptoStaticTabFallbackContent[ptoTab];
  const text = content || fallbackContent;

  return text ? <div style={ptoInfoBlockStyle}>{text}</div> : null;
}

export const ptoInfoBlockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
