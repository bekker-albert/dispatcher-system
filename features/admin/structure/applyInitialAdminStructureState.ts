import type { Dispatch, SetStateAction } from "react";
import type { DependencyLink, DependencyNode, OrgMember } from "@/lib/domain/admin/structure";
import type { InitialAdminStructureState } from "@/features/admin/structure/initialAdminStructureState";

export type InitialAdminStructureStateSetters = {
  setOrgMembers: Dispatch<SetStateAction<OrgMember[]>>;
  setDependencyNodes: Dispatch<SetStateAction<DependencyNode[]>>;
  setDependencyLinks: Dispatch<SetStateAction<DependencyLink[]>>;
  setDependencyLinkForm: Dispatch<SetStateAction<DependencyLink>>;
};

export function applyInitialAdminStructureState(
  state: InitialAdminStructureState,
  setters: InitialAdminStructureStateSetters,
) {
  if (state.orgMembers) {
    setters.setOrgMembers(state.orgMembers);
  }

  if (state.dependencyNodes) {
    setters.setDependencyNodes(state.dependencyNodes);
    if (state.dependencyLinkFormPatch) {
      setters.setDependencyLinkForm((current) => ({
        ...current,
        ...state.dependencyLinkFormPatch,
      }));
    }
  }

  if (state.dependencyLinks) {
    setters.setDependencyLinks(state.dependencyLinks);
  }
}
