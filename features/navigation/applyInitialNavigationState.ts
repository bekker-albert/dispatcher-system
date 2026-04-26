import type { Dispatch, SetStateAction } from "react";
import type { CustomTab, EditableSubtabGroup, SubTabConfig, TopTabDefinition } from "@/lib/domain/navigation/tabs";
import type { InitialNavigationState } from "@/features/navigation/initialNavigationState";

export type InitialNavigationStateSetters = {
  setCustomTabs: Dispatch<SetStateAction<CustomTab[]>>;
  setTopTabs: Dispatch<SetStateAction<TopTabDefinition[]>>;
  setSubTabs: Dispatch<SetStateAction<Record<EditableSubtabGroup, SubTabConfig[]>>>;
};

export function applyInitialNavigationState(state: InitialNavigationState, setters: InitialNavigationStateSetters) {
  setters.setCustomTabs(state.customTabs);

  if (state.topTabs) {
    setters.setTopTabs(state.topTabs);
  }

  if (state.subTabs) {
    setters.setSubTabs(state.subTabs);
  }
}
