"use client";

import type { ChangeEvent } from "react";
import { useCallback, useRef, useState } from "react";

type UsePtoBucketsCellDraftOptions = {
  editingMode: boolean;
  onCommitValue: (cellKey: string, draft: string) => void;
};

export function usePtoBucketsCellDraft({
  editingMode,
  onCommitValue,
}: UsePtoBucketsCellDraftOptions) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const skipBlurCommitRef = useRef<string | null>(null);
  const draftRef = useRef("");

  const cancelEdit = useCallback(() => {
    setEditKey(null);
    draftRef.current = "";
    setDraft("");
  }, []);

  const startDraft = useCallback((cellKey: string, nextDraft: string) => {
    setEditKey(cellKey);
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }, []);

  const finishEdit = useCallback((cellKey: string) => {
    if (!editingMode) return;
    onCommitValue(cellKey, draftRef.current);
    setEditKey((current) => (current === cellKey ? null : current));
    draftRef.current = "";
    setDraft("");
  }, [editingMode, onCommitValue]);

  const skipNextBlurCommit = useCallback((cellKey: string | null) => {
    skipBlurCommitRef.current = cellKey;
  }, []);

  const handleCellDraftChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    draftRef.current = event.target.value;
  }, []);

  const handleCellBlur = useCallback((cellKey: string) => {
    if (skipBlurCommitRef.current === cellKey) {
      skipBlurCommitRef.current = null;
      return;
    }

    finishEdit(cellKey);
  }, [finishEdit]);

  return {
    cancelEdit,
    draft,
    editKey,
    finishEdit,
    handleCellBlur,
    handleCellDraftChange,
    skipNextBlurCommit,
    startDraft,
  };
}
