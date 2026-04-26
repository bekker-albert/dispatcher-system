"use client";

import type { FocusEvent, KeyboardEvent } from "react";
import { PtoReadonlyTextCell } from "@/features/pto/PtoDateTableParts";
import { ptoPlanInputStyle } from "@/features/pto/ptoDateTableStyles";

export type PtoDateTextField = "area" | "location" | "structure";

type PtoDateEditableTextCellProps = {
  editing: boolean;
  value: string;
  draftValue: string;
  dataFieldKey: string;
  listId?: string;
  options?: string[];
  placeholder: string;
  onBeginDraft: () => void;
  onUpdateDraft: (value: string) => void;
  onCommitDraft: () => void;
  onCancelDraft: () => void;
};

export function PtoDateEditableTextCell({
  editing,
  value,
  draftValue,
  dataFieldKey,
  listId,
  options,
  placeholder,
  onBeginDraft,
  onUpdateDraft,
  onCommitDraft,
  onCancelDraft,
}: PtoDateEditableTextCellProps) {
  if (!editing) return <PtoReadonlyTextCell value={value} />;

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (event.currentTarget.dataset.skipPtoTextCommit === "true") {
      delete event.currentTarget.dataset.skipPtoTextCommit;
      return;
    }

    onCommitDraft();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommitDraft();
      event.currentTarget.dataset.skipPtoTextCommit = "true";
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancelDraft();
      event.currentTarget.dataset.skipPtoTextCommit = "true";
      event.currentTarget.blur();
    }
  };

  return (
    <>
      <input
        data-pto-row-field={dataFieldKey}
        list={listId}
        value={draftValue}
        onFocus={onBeginDraft}
        onChange={(event) => onUpdateDraft(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={ptoPlanInputStyle}
      />
      {listId && options ? (
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}
