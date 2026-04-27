"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import {
  PtoEditableHeaderText,
  PtoEditableMonthHeader,
} from "@/features/pto/PtoDateHeaderEditors";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";

type UsePtoDateHeaderRenderersOptions = Pick<
  PtoDateTableContainerProps,
  | "cancelPtoHeaderEdit"
  | "commitPtoHeaderEdit"
  | "editingPtoHeaderKey"
  | "ptoDateEditing"
  | "ptoHeaderDraft"
  | "ptoHeaderLabel"
  | "requestPtoDatabaseSave"
  | "setExpandedPtoMonths"
  | "setPtoHeaderDraft"
  | "startPtoHeaderEdit"
>;

type PtoDateHeaderRenderers = {
  renderPtoHeaderText: (key: string, fallback: string, align?: CSSProperties["textAlign"]) => ReactNode;
  renderPtoMonthHeader: (month: string, fallback: string, expanded: boolean) => ReactNode;
};

export function usePtoDateHeaderRenderers({
  cancelPtoHeaderEdit,
  commitPtoHeaderEdit,
  editingPtoHeaderKey,
  ptoDateEditing,
  ptoHeaderDraft,
  ptoHeaderLabel,
  requestPtoDatabaseSave,
  setExpandedPtoMonths,
  setPtoHeaderDraft,
  startPtoHeaderEdit,
}: UsePtoDateHeaderRenderersOptions): PtoDateHeaderRenderers {
  const renderPtoHeaderText = (key: string, fallback: string, align: CSSProperties["textAlign"] = "left") => (
    <PtoEditableHeaderText
      columnKey={key}
      fallback={fallback}
      label={ptoHeaderLabel(key, fallback)}
      align={align}
      editing={editingPtoHeaderKey === key}
      editingEnabled={ptoDateEditing}
      draft={ptoHeaderDraft}
      onDraftChange={setPtoHeaderDraft}
      onStartEdit={startPtoHeaderEdit}
      onCommit={commitPtoHeaderEdit}
      onCancel={cancelPtoHeaderEdit}
    />
  );

  const renderPtoMonthHeader = (month: string, fallback: string, expanded: boolean) => {
    const key = `month-group:${month}`;

    return (
      <PtoEditableMonthHeader
        columnKey={key}
        fallback={fallback}
        label={ptoHeaderLabel(key, fallback)}
        editing={editingPtoHeaderKey === key}
        editingEnabled={ptoDateEditing}
        draft={ptoHeaderDraft}
        expanded={expanded}
        icon={expanded ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
        onDraftChange={setPtoHeaderDraft}
        onStartEdit={startPtoHeaderEdit}
        onCommit={commitPtoHeaderEdit}
        onCancel={cancelPtoHeaderEdit}
        onToggle={() => {
          setExpandedPtoMonths((current) => ({ ...current, [month]: !current[month] }));
          requestPtoDatabaseSave();
        }}
      />
    );
  };

  return {
    renderPtoHeaderText,
    renderPtoMonthHeader,
  };
}
