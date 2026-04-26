import {
  dependencyLinkFormNodePatch,
  normalizeStoredDependencyLinks,
  normalizeStoredDependencyNodes,
  normalizeStoredOrgMembers,
} from "@/features/admin/structure/adminStructurePersistence";

type InitialAdminStructureStateInput = {
  savedOrgMembers: unknown;
  savedDependencyNodes: unknown;
  savedDependencyLinks: unknown;
};

export function buildInitialAdminStructureState({
  savedOrgMembers,
  savedDependencyNodes,
  savedDependencyLinks,
}: InitialAdminStructureStateInput) {
  const orgMembers = normalizeStoredOrgMembers(savedOrgMembers);
  const dependencyNodes = normalizeStoredDependencyNodes(savedDependencyNodes);

  return {
    orgMembers,
    dependencyNodes,
    dependencyLinkFormPatch: dependencyNodes ? dependencyLinkFormNodePatch(dependencyNodes) : null,
    dependencyLinks: normalizeStoredDependencyLinks(savedDependencyLinks),
  };
}
