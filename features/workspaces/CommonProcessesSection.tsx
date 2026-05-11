"use client";

import { ClipboardList, Clock, FileText, History, Plane, Workflow } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { getWorkspaceById } from "@/lib/domain/workspaces/workspaces";
import { SectionCard } from "@/shared/ui/layout";

const commonWorkspace = getWorkspaceById("common-processes");

export function CommonProcessesSection() {
  return (
    <SectionCard title={commonWorkspace?.title ?? "Общие процессы"}>
      <div style={introStyle}>
        <div>
          <div style={eyebrowStyle}>Архитектурный каркас</div>
          <h1 style={titleStyle}>Общие процессы диспетчерской службы</h1>
          <p style={leadStyle}>
            Здесь будет общий workflow для переработок, командировок, совмещений, выходов в выходной день,
            согласований, документов и напоминаний. Сейчас экран намеренно легкий: он не тянет производственные
            таблицы и не добавляет state в AppRoot.
          </p>
        </div>
      </div>

      <div style={processGridStyle}>
        <ProcessTile icon={<Clock size={18} aria-hidden />} title="Переработки" text="Сотрудник, участок, дата, смена, причина, часы, инициатор, согласующий и статус." />
        <ProcessTile icon={<Workflow size={18} aria-hidden />} title="Совмещение и вакансия" text="Работа за вакансию, временное совмещение и основание с обязательной историей решений." />
        <ProcessTile icon={<Plane size={18} aria-hidden />} title="Командировки" text="Период, маршрут, цель, задачи, связанная техника, монтажи СМТС и отчет по итогам." />
        <ProcessTile icon={<FileText size={18} aria-hidden />} title="Документы" text="Черновик, согласование, возврат, подписание, закрытие и хранение вложений по запросу." />
        <ProcessTile icon={<ClipboardList size={18} aria-hidden />} title="Согласования" text="Единая модель статусов для начальника ДС, участков, таксировки, СМТС и подрядчиков." />
        <ProcessTile icon={<History size={18} aria-hidden />} title="Журнал событий" text="Кто изменил, что изменил, когда, старое/новое значение и основание изменения." />
      </div>

      <div style={rulesStyle}>
        <h2 style={rulesTitleStyle}>Правила будущей реализации</h2>
        <ul style={rulesListStyle}>
          <li>Открывать списки по периоду, статусу, участку и ответственному, с серверной пагинацией.</li>
          <li>Редактирование включать явной кнопкой, сохранять только измененные поля и проверять version.</li>
          <li>Историю изменений писать отдельными событиями, не затирая исходные документы.</li>
          <li>Вложения, Excel и PDF генерировать по запросу, без постоянного удержания файлов в памяти.</li>
        </ul>
      </div>
    </SectionCard>
  );
}

function ProcessTile({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article style={tileStyle}>
      <div style={tileIconStyle}>{icon}</div>
      <div>
        <h2 style={tileTitleStyle}>{title}</h2>
        <p style={tileTextStyle}>{text}</p>
      </div>
    </article>
  );
}

const introStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  marginBottom: 14,
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
  maxWidth: 980,
};

const processGridStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  marginBottom: 14,
};

const tileStyle: CSSProperties = {
  alignItems: "start",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 10,
  gridTemplateColumns: "auto minmax(0, 1fr)",
  padding: 12,
};

const tileIconStyle: CSSProperties = {
  alignItems: "center",
  background: "#ecfeff",
  borderRadius: 8,
  color: "#0e7490",
  display: "inline-flex",
  height: 36,
  justifyContent: "center",
  width: 36,
};

const tileTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 15,
  lineHeight: 1.2,
  margin: 0,
};

const tileTextStyle: CSSProperties = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.4,
  margin: "5px 0 0",
};

const rulesStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
};

const rulesTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  lineHeight: 1.2,
  margin: "0 0 8px",
};

const rulesListStyle: CSSProperties = {
  color: "#334155",
  display: "grid",
  fontSize: 13,
  gap: 6,
  lineHeight: 1.4,
  margin: 0,
  paddingLeft: 18,
};
