import { useCallback, type Dispatch, type SetStateAction } from "react";

type UseEditableHeaderLabelsOptions = {
  labels: Record<string, string>;
  draft: string;
  setLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setEditingKey: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<string>>;
  onCommit?: (key: string, fallback: string, nextLabel: string) => void;
};

export function useEditableHeaderLabels({
  labels,
  draft,
  setLabels,
  setEditingKey,
  setDraft,
  onCommit,
}: UseEditableHeaderLabelsOptions) {
  const headerLabel = useCallback((key: string, fallback: string) => {
    return labels[key]?.trim() || fallback;
  }, [labels]);

  const startHeaderEdit = useCallback((key: string, fallback: string) => {
    setEditingKey(key);
    setDraft(headerLabel(key, fallback));
  }, [headerLabel, setDraft, setEditingKey]);

  const cancelHeaderEdit = useCallback(() => {
    setEditingKey(null);
    setDraft("");
  }, [setDraft, setEditingKey]);

  const commitHeaderEdit = useCallback((key: string, fallback: string) => {
    const nextLabel = draft.trim();

    setLabels((current) => {
      const next = { ...current };
      if (!nextLabel || nextLabel === fallback) {
        delete next[key];
      } else {
        next[key] = nextLabel;
      }
      return next;
    });
    setEditingKey(null);
    setDraft("");
    onCommit?.(key, fallback, nextLabel);
  }, [draft, onCommit, setDraft, setEditingKey, setLabels]);

  return {
    headerLabel,
    startHeaderEdit,
    cancelHeaderEdit,
    commitHeaderEdit,
  };
}
