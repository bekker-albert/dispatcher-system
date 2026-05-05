"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Check, FileText, RotateCcw, Send, X } from "lucide-react";

import type {
  AiAssistantCodexPromptDraft,
  AiAssistantDevelopmentIdea,
} from "@/features/ai-assistant/types";
import {
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
  const [selectedIdeaId, setSelectedIdeaId] = useState(() => ideas[0]?.id ?? "");
  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0];
  const promptsByIdeaId = useMemo(
    () => new Map(
      codexPromptDrafts
        .filter((prompt) => prompt.linkedIdeaId)
        .map((prompt) => [prompt.linkedIdeaId!, prompt]),
    ),
    [codexPromptDrafts],
  );

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={panelHeaderStyle}>
        <div style={panelTitleStyle}>Развитие / ТЗ / Codex</div>
      </div>

      {selectedIdea ? (
        <div style={developmentLayoutStyle}>
          <div style={ideasListStyle}>
            {ideas.map((idea) => (
              <button
                key={idea.id}
                type="button"
                onClick={() => setSelectedIdeaId(idea.id)}
                style={{
                  ...ideaListButtonStyle,
                  borderColor: idea.id === selectedIdea.id ? "#0f172a" : ideaListButtonStyle.borderColor,
                  background: idea.id === selectedIdea.id ? "#f8fafc" : "#ffffff",
                }}
              >
                <span style={ideaListTitleStyle}>{idea.title}</span>
                <span style={ideaListMetaStyle}>
                  {formatIdeaStatus(idea.status)} · {idea.affectedModules.slice(0, 2).join(", ")}
                </span>
              </button>
            ))}
          </div>

          <IdeaDetails
            idea={selectedIdea}
            prompt={promptsByIdeaId.get(selectedIdea.id)}
            onCreateCodexPromptDraft={onCreateCodexPromptDraft}
            onSetIdeaStatus={onSetIdeaStatus}
          />
        </div>
      ) : (
        <div style={emptyStateStyle}>Идей развития пока нет.</div>
      )}
    </section>
  );
}

function IdeaDetails({
  idea,
  prompt,
  onSetIdeaStatus,
  onCreateCodexPromptDraft,
}: {
  idea: AiAssistantDevelopmentIdea;
  prompt?: AiAssistantCodexPromptDraft;
  onSetIdeaStatus: (ideaId: string, status: AiAssistantDevelopmentIdea["status"]) => void;
  onCreateCodexPromptDraft: (idea: AiAssistantDevelopmentIdea) => void;
}) {
  return (
    <article style={detailsPanelStyle}>
      <div style={detailsHeaderStyle}>
        <div>
          <div style={detailsTitleStyle}>{idea.title}</div>
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

      <div style={summaryGridStyle}>
        <InfoLine title="Описание" value={idea.description} />
        <InfoLine title="Польза" value={idea.benefit} />
        <InfoLine title="Риски" value={formatList(idea.risks)} />
        <InfoLine title="Модули" value={formatList(idea.affectedModules)} />
      </div>

      <div style={compactSectionsStyle}>
        <CompactBlock title="Бизнес-логика" values={idea.businessLogic} />
        <CompactBlock title="Критерии приемки" values={idea.acceptanceCriteria} />
        <CompactBlock title="Вопросы" values={idea.missingQuestions.length > 0 ? idea.missingQuestions : ["Нет"]} />
        <CompactBlock
          title="Codex-промт"
          values={prompt ? [prompt.title, trimPromptPreview(prompt.body)] : ["Промт еще не сформирован"]}
        />
      </div>
    </article>
  );
}

function InfoLine({ title, value }: { title: string; value: string }) {
  return (
    <div style={infoLineStyle}>
      <span style={infoTitleStyle}>{title}</span>
      <span style={infoValueStyle}>{value}</span>
    </div>
  );
}

function CompactBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div style={compactBlockStyle}>
      <div style={infoTitleStyle}>{title}</div>
      <div style={compactValueStyle}>
        {values.map((value) => (
          <div key={value}>{value}</div>
        ))}
      </div>
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

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "Нет";
}

function trimPromptPreview(value: string) {
  return value.length > 420 ? `${value.slice(0, 420)}...` : value;
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

const developmentLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(240px, 320px) minmax(0, 1fr)",
  gap: 10,
  alignItems: "start",
};

const ideasListStyle: CSSProperties = {
  display: "grid",
  gap: 6,
};

const ideaListButtonStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: "9px 10px",
  textAlign: "left",
  cursor: "pointer",
};

const ideaListTitleStyle: CSSProperties = {
  display: "block",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.25,
  marginBottom: 3,
};

const ideaListMetaStyle: CSSProperties = {
  display: "block",
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.25,
};

const detailsPanelStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
};

const detailsHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto",
  gap: 10,
  alignItems: "start",
  marginBottom: 10,
};

const detailsTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
  gap: 7,
  marginBottom: 8,
};

const infoLineStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "7px 8px",
  background: "#f8fafc",
};

const infoTitleStyle: CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#64748b",
  fontWeight: 900,
  marginBottom: 3,
};

const infoValueStyle: CSSProperties = {
  display: "block",
  color: "#0f172a",
  fontSize: 13,
  lineHeight: 1.35,
};

const compactSectionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
  gap: 7,
};

const compactBlockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "7px 8px",
  background: "#ffffff",
};

const compactValueStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  color: "#0f172a",
  fontSize: 12,
  lineHeight: 1.35,
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

const emptyStateStyle: CSSProperties = {
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: 14,
  color: "#64748b",
  textAlign: "center",
  background: "#ffffff",
  fontSize: 13,
};
