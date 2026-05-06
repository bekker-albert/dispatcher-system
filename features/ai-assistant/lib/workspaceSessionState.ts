export type AiAssistantWorkspaceSessionState = {
  editingBody: string;
  editingId: string | null;
  feedback: string;
  savedBodies: Record<string, string>;
  selectedId: string | null;
};

export function createAiAssistantWorkspaceSessionState(): AiAssistantWorkspaceSessionState {
  return {
    editingBody: "",
    editingId: null,
    feedback: "",
    savedBodies: {},
    selectedId: null,
  };
}
