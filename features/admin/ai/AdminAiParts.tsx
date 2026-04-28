import type { ReactNode } from "react";
import type {
  AdminAiAccumulatedReason,
  AdminAiAccumulationContent,
  AdminAiDatabaseContent,
  AdminAiDatabaseRow,
  AdminAiHeaderContent,
  AdminAiReasonPreviewContent,
  AdminAiRuleContent,
  AdminAiSourceNote,
} from "./adminAiContent";
import {
  accumulatedListStyle,
  badgeStyle,
  compactInputStyle,
  compactRowHoursStyle,
  compactRowNoteStyle,
  compactRowStyle,
  compactRowTitleStyle,
  databaseHeadRowStyle,
  databasePanelStyle,
  databaseTableStyle,
  databaseTableWrapStyle,
  databaseTitleStyle,
  descriptionStyle,
  headerStyle,
  hintStyle,
  innerPanelStyle,
  panelTitleStyle,
  previewGridStyle,
  reasonFieldsStyle,
  reasonTextareaStyle,
  ruleBodyStyle,
  ruleGridStyle,
  sourceGridStyle,
  titleStyle,
} from "./adminAiStyles";
import { CompactTd, CompactTh, Field, SourceNote } from "@/shared/ui/layout";

type AdminAiPreviewGridProps = {
  children: ReactNode;
};

export function AdminAiPreviewGrid({ children }: AdminAiPreviewGridProps) {
  return <div style={previewGridStyle}>{children}</div>;
}

type AdminAiHeaderProps = {
  content: AdminAiHeaderContent;
};

export function AdminAiHeader({ content }: AdminAiHeaderProps) {
  return (
    <div style={headerStyle}>
      <div>
        <div style={titleStyle}>{content.title}</div>
        <div style={descriptionStyle}>{content.description}</div>
      </div>
      <span style={badgeStyle}>{content.badge}</span>
    </div>
  );
}

type AdminAiSourceGridProps = {
  notes: AdminAiSourceNote[];
};

export function AdminAiSourceGrid({ notes }: AdminAiSourceGridProps) {
  return (
    <div style={sourceGridStyle}>
      {notes.map((note) => (
        <SourceNote key={note.title} title={note.title} source={note.source} text={note.text} />
      ))}
    </div>
  );
}

type AdminAiReasonPreviewPanelProps = {
  content: AdminAiReasonPreviewContent;
};

export function AdminAiReasonPreviewPanel({ content }: AdminAiReasonPreviewPanelProps) {
  return (
    <div style={innerPanelStyle}>
      <div style={panelTitleStyle}>{content.title}</div>
      <div style={reasonFieldsStyle}>
        {content.fields.map((field) => (
          <Field key={field.label} label={field.label}>
            <input value={field.value} readOnly style={compactInputStyle} />
          </Field>
        ))}
      </div>
      <Field label={content.reasonLabel}>
        <textarea readOnly value={content.reason} style={reasonTextareaStyle} />
      </Field>
      <div style={hintStyle}>{content.note}</div>
    </div>
  );
}

type AdminAiAccumulatedReasonsPanelProps = {
  content: AdminAiAccumulationContent;
};

export function AdminAiAccumulatedReasonsPanel({ content }: AdminAiAccumulatedReasonsPanelProps) {
  return (
    <div style={innerPanelStyle}>
      <div style={panelTitleStyle}>{content.title}</div>
      <div style={accumulatedListStyle}>
        {content.reasons.map((reason) => (
          <AccumulatedReason key={reason.title} reason={reason} />
        ))}
      </div>
    </div>
  );
}

type AccumulatedReasonProps = {
  reason: AdminAiAccumulatedReason;
};

function AccumulatedReason({ reason }: AccumulatedReasonProps) {
  return (
    <div style={compactRowStyle}>
      <div>
        <div style={compactRowTitleStyle}>{reason.title}</div>
        <div style={compactRowNoteStyle}>{reason.note}</div>
      </div>
      <div style={compactRowHoursStyle}>{reason.hours}</div>
    </div>
  );
}

type AdminAiDatabasePanelProps = {
  content: AdminAiDatabaseContent;
};

export function AdminAiDatabasePanel({ content }: AdminAiDatabasePanelProps) {
  return (
    <div style={databasePanelStyle}>
      <div style={databaseTitleStyle}>{content.title}</div>
      <div style={databaseTableWrapStyle}>
        <table style={databaseTableStyle}>
          <thead>
            <tr style={databaseHeadRowStyle}>
              {content.columns.map((column) => (
                <CompactTh key={column}>{column}</CompactTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row) => (
              <DatabaseRow key={row.table} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type DatabaseRowProps = {
  row: AdminAiDatabaseRow;
};

function DatabaseRow({ row }: DatabaseRowProps) {
  return (
    <tr>
      <CompactTd>
        <strong>{row.table}</strong>
      </CompactTd>
      <CompactTd>{row.stores}</CompactTd>
      <CompactTd>{row.purpose}</CompactTd>
      <CompactTd>{row.owner}</CompactTd>
    </tr>
  );
}

type AdminAiRuleGridProps = {
  rules: AdminAiRuleContent[];
};

export function AdminAiRuleGrid({ rules }: AdminAiRuleGridProps) {
  return (
    <div style={ruleGridStyle}>
      {rules.map((rule) => (
        <RuleCard key={rule.title} rule={rule} />
      ))}
    </div>
  );
}

type RuleCardProps = {
  rule: AdminAiRuleContent;
};

function RuleCard({ rule }: RuleCardProps) {
  return (
    <div style={innerPanelStyle}>
      <div style={panelTitleStyle}>{rule.title}</div>
      <div style={ruleBodyStyle}>{rule.body}</div>
    </div>
  );
}
