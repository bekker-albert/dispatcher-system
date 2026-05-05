"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { FileText, Mail, Send } from "lucide-react";

import type {
  AiAssistantDocument,
  AiAssistantDocumentologItem,
  AiAssistantMailDraft,
} from "@/features/ai-assistant/types";
import { aiAssistantMutedTextStyle, aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

export function AiAssistantDocumentsPanel({
  documents,
  documentologItems,
  mailDrafts,
}: {
  documents: AiAssistantDocument[];
  documentologItems: AiAssistantDocumentologItem[];
  mailDrafts: AiAssistantMailDraft[];
}) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const cards = [
    ...documents.map((document) => ({
      id: document.id,
      title: document.title,
      subtitle: formatDocumentStatus(document.status),
      text: document.type,
      kind: "document" as const,
    })),
    ...mailDrafts.map((draft) => ({
      id: draft.id,
      title: draft.subject,
      subtitle: formatMailStatus(draft.status),
      text: draft.to.join(", "),
      kind: "mail" as const,
    })),
    ...documentologItems.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: formatDocumentologStatus(item.status),
      text: item.comment || item.approver,
      kind: "documentolog" as const,
    })),
  ];

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>Документы</div>
        <div style={aiAssistantMutedTextStyle}>Черновики документов, писем и Documentolog без реальной отправки.</div>
      </div>

      <div style={cardsGridStyle}>
        {cards.map((card) => {
          const Icon = card.kind === "mail" ? Mail : card.kind === "documentolog" ? Send : FileText;
          const isOpen = selectedCardId === card.id;

          return (
            <article key={card.id} style={cardStyle}>
              <div style={cardTopStyle}>
                <Icon size={18} />
                <div>
                  <div style={cardTitleStyle}>{card.title}</div>
                  <div style={aiAssistantMutedTextStyle}>{card.subtitle}</div>
                </div>
              </div>
              <div style={cardTextStyle}>{card.text}</div>
              {isOpen && (
                <div style={detailsStyle}>Открыто для просмотра: {card.subtitle}</div>
              )}
              <button type="button" onClick={() => setSelectedCardId(card.id)} style={openButtonStyle}>Открыть</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatDocumentStatus(status: AiAssistantDocument["status"]) {
  const labels: Record<AiAssistantDocument["status"], string> = {
    draft: "Черновик",
    review: "На проверке",
    approved: "Согласовано",
    "sent-to-documentolog": "Передано в Documentolog",
    signing: "На подписании",
    signed: "Подписано",
    rejected: "Отклонено",
    archive: "Архив",
  };

  return labels[status];
}

function formatMailStatus(status: AiAssistantMailDraft["status"]) {
  const labels: Record<AiAssistantMailDraft["status"], string> = {
    draft: "Черновик",
    "needs-approval": "Нужно решение",
    approved: "Согласовано",
    sent: "Отправлено",
    rejected: "Отклонено",
  };

  return labels[status];
}

function formatDocumentologStatus(status: AiAssistantDocumentologItem["status"]) {
  const labels: Record<AiAssistantDocumentologItem["status"], string> = {
    prepared: "Подготовлено",
    sent: "Отправлено",
    "in-approval": "На согласовании",
    approved: "Согласовано",
    rejected: "Отклонено",
    "needs-rework": "На доработке",
  };

  return labels[status];
}

const headerStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  marginBottom: 10,
};

const titleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 17,
  fontWeight: 900,
};

const cardsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 8,
};

const cardStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
};

const cardTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 8,
  alignItems: "start",
};

const cardTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 900,
};

const cardTextStyle: CSSProperties = {
  color: "#334155",
  fontSize: 13,
  marginTop: 8,
  minHeight: 34,
};

const detailsStyle: CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: 8,
  fontSize: 12,
  fontWeight: 800,
  marginTop: 8,
};

const openButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "6px 8px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};
