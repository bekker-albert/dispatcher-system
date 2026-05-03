"use client";

import type { CSSProperties } from "react";

import { PtoEditableHeaderText } from "@/features/pto/PtoDateHeaderEditors";
import { ptoHeaderLabelButtonStyle } from "@/features/pto/ptoDateTableStyles";

export type PtoMatrixHeaderEditor = {
  headerScope: string;
  editingHeaderKey: string | null;
  headerDraft: string;
  headerLabel: (key: string, fallback: string) => string;
  setHeaderDraft: (value: string) => void;
  startHeaderEdit: (key: string, fallback: string) => void;
  commitHeaderEdit: (key: string, fallback: string) => void;
  cancelHeaderEdit: () => void;
};

export type PtoMatrixHeaderEditorBase = Omit<PtoMatrixHeaderEditor, "headerScope">;

const noopMatrixHeaderEditor: PtoMatrixHeaderEditorBase = {
  editingHeaderKey: null,
  headerDraft: "",
  headerLabel: (_key, fallback) => fallback,
  setHeaderDraft: () => undefined,
  startHeaderEdit: () => undefined,
  commitHeaderEdit: () => undefined,
  cancelHeaderEdit: () => undefined,
};

export function createPtoMatrixHeaderEditor(
  baseEditor: PtoMatrixHeaderEditorBase | undefined,
  headerScope: string,
): PtoMatrixHeaderEditor {
  return {
    ...(baseEditor ?? noopMatrixHeaderEditor),
    headerScope,
  };
}

export function renderPtoMatrixHeaderText(
  editor: PtoMatrixHeaderEditor,
  editingEnabled: boolean,
  key: string,
  fallback: string,
  align: CSSProperties["textAlign"] = "left",
) {
  const scopedKey = `matrix:${editor.headerScope}:${key}`;

  return (
    <PtoEditableHeaderText
      columnKey={scopedKey}
      fallback={fallback}
      label={editor.headerLabel(scopedKey, fallback)}
      align={align}
      editing={editor.editingHeaderKey === scopedKey}
      editingEnabled={editingEnabled}
      draft={editor.headerDraft}
      onDraftChange={editor.setHeaderDraft}
      onStartEdit={editor.startHeaderEdit}
      onCommit={editor.commitHeaderEdit}
      onCancel={editor.cancelHeaderEdit}
    />
  );
}

export function renderReadonlyPtoMatrixHeaderText(
  fallback: string,
  align: CSSProperties["textAlign"] = "left",
) {
  return (
    <span style={{ ...ptoHeaderLabelButtonStyle, cursor: "default", textAlign: align }}>
      {fallback}
    </span>
  );
}
