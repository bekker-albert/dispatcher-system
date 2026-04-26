import { normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs, type EditableSubtabGroup, type SubTabConfig } from "@/lib/domain/navigation/tabs";

type InitialNavigationStateInput = {
  savedCustomTabs: unknown;
  savedTopTabs: unknown;
  savedSubTabs: unknown;
  defaultSubTabs: Record<EditableSubtabGroup, SubTabConfig[]>;
};

export function buildInitialNavigationState({
  savedCustomTabs,
  savedTopTabs,
  savedSubTabs,
  defaultSubTabs,
}: InitialNavigationStateInput) {
  return {
    customTabs: normalizeStoredCustomTabs(savedCustomTabs),
    topTabs: savedTopTabs ? normalizeStoredTopTabs(savedTopTabs) : null,
    subTabs: savedSubTabs ? normalizeStoredSubTabs(savedSubTabs, defaultSubTabs) : null,
  };
}
