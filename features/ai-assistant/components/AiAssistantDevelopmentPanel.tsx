"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check, FileText, RotateCcw, Send, X } from "lucide-react";

import type {
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
} from "@/features/ai-assistant/types";
import {
  aiAssistantListItemStyle,
  aiAssistantListStyle,
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export function AiAssistantDevelopmentPanel({
  ideas,
  codexPromptDrafts,
  onSetIdeaStatus,
  onCreateCodexPromptDraft,
}: {
  ideas: AiAssistantDevelopmentIdea[];
  codexPromptDrafts: AiAssistantCodexPromptDraft[];
  onSetIdeaStatus: (ideaId: string, status: AiAssistantDevelopmentIdea["status"]) => void;
  onCreateCodexPromptDraft: (idea: AiAssistantDevelopmentIdea) => void;
}) {
  const promptsByIdeaId = new Map(
    codexPromptDrafts
      .filter((prompt) => prompt.linkedIdeaId)
      .map((prompt) => [prompt.linkedIdeaId!, prompt]),
  );

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>Развитие / ТЗ / Codex</div>
        <div style={aiAssistantMutedTextStyle}>Идеи развития превращаются в ТЗ, критерии приемки и промты без вызова внешнего AI API.</div>
      </div>

      <div style={aiAssistantListStyle}>
        {ideas.map((idea) => {
          const prompt = promptsByIdeaId.get(idea.id);

          return (
            <article key={idea.id} style={ideaCardStyle}>
              <div style={ideaHeaderStyle}>
                <div>
                  <div style={ideaTitleStyle}>{idea.title}</div>
                  <div style={aiAssistantMutedTextStyle}>{formatIdeaStatus(idea.status)}</div>
                </div>
                <div style={actionsStyle}>
                  <ActionButton label="Сформировать ТЗ" onClick={() => onSetIdeaStatus(idea.id, "spec-ready")}>
                    <FileText size={15} />
                    <span>ТЗ</span>
                  </ActionButton>
                  <ActionButton label="Сформировать промт для Codex" onClick={() => onCreateCodexPromptDraft(idea)}>
                    <Send size={15} />
                    <span>Промт</span>
                  </ActionButton>
                  <ActionButton label="Принять" tone="primary" onClick={() => onSetIdeaStatus(idea.id, "accepted")}>
                    <Check size={15} />
                    <span>Принять</span>
                  </ActionButton>
                  <ActionButton label="Отклонить" tone="danger" onClick={() => onSetIdeaStatus(idea.id, "rejected")}>
                    <X size={15} />
                    <span>Отклонить</span>
                  </ActionButton>
                  <ActionButton label="Вернуть на уточнение" onClick={() => onSetIdeaStatus(idea.id, "needs-clarification")}>
                    <RotateCcw size={15} />
                    <span>Уточнить</span>
                  </ActionButton>
                </div>
              </div>

              <div style={ideaGridStyle}>
                <InfoBlock title="Описание" value={idea.description} />
                <InfoBlock title="Польза" value={idea.benefit} />
                <InfoBlock title="Риски" value={idea.risks.join("; ")} />
                <InfoBlock title="Модули" value={idea.affectedModules.join(", ")} />
                <InfoBlock title="Бизнес-логика" value={idea.businessLogic.join("\n")} />
                <InfoBlock title="Критерии приемки" value={idea.acceptanceCriteria.join("\n")} />
                <InfoBlock title="Вопросы" value={idea.missingQuestions.join("\n") || "Нет"} />
                <InfoBlock title="Codex-промт" value={prompt ? `${prompt.title}\n${prompt.body}` : "Промт еще не сформирован"} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div style={infoBlockStyle}>
      <div style={infoTitleStyle}>{title}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  tone = "secondary",
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "secondary";
}) {
  const style = tone === "primary"
    ? primaryButtonStyle
    : tone === "danger"
      ? dangerButtonStyle
      : secondaryButtonStyle;

  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function formatIdeaStatus(status: AiAssistantDevelopmentIdea["status"]) {
  const labels: Record<AiAssistantDevelopmentIdea["status"], string> = {
    new: "Новая",
    reviewing: "На разборе",
    accepted: "Принята",
    rejected: "Отклонена",
    "needs-clarification": "Нужно уточнение",
    "spec-ready": "ТЗ готово",
    "sent-to-codex": "Передана в Codex",
    "in-development": "В разработке",
    done: "Готово",
  };

  return labels[status];
}

const panelHeaderStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  marginBottom: 10,
};

const panelTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

const ideaCardStyle: CSSProperties = {
  ...aiAssistantListItemStyle,
  display: "grid",
  gap: 10,
};

const ideaHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
};

const ideaTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: "#0f172a",
};

const ideaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 8,
};

const infoBlockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 9,
  background: "#f8fafc",
};

const infoTitleStyle: CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0,
  color: "#64748b",
  fontWeight: 900,
  marginBottom: 4,
};

const infoValueStyle: CSSProperties = {
  whiteSpace: "pre-wrap",
  fontSize: 13,
  lineHeight: 1.35,
  color: "#0f172a",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 5,
};

const baseButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 8,
  padding: "6px 8px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const primaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const dangerButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
};
