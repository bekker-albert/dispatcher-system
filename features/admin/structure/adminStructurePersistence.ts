import {
  defaultDependencyLinkForm,
  defaultDependencyLinks,
  defaultDependencyNodeForm,
  defaultDependencyNodes,
  defaultOrgMemberForm,
  type DependencyLink,
  type DependencyNode,
  type OrgMember,
} from "@/lib/domain/admin/structure";
import { isRecord, mergeDefaultsById } from "@/lib/utils/normalizers";

export function normalizeStoredOrgMembers(value: unknown): OrgMember[] | null {
  if (!Array.isArray(value)) return null;

  return value.map((member) => ({
    ...defaultOrgMemberForm,
    ...(isRecord(member) ? member : {}),
    active: !isRecord(member) || member.active !== false,
  } as OrgMember));
}

export function normalizeStoredDependencyNodes(value: unknown): DependencyNode[] | null {
  if (!Array.isArray(value)) return null;

  const parsedNodes = value.map((node) => ({
    ...defaultDependencyNodeForm,
    ...(isRecord(node) ? node : {}),
    visible: !isRecord(node) || node.visible !== false,
  } as DependencyNode));

  return mergeDefaultsById(parsedNodes, defaultDependencyNodes);
}

export function normalizeStoredDependencyLinks(value: unknown): DependencyLink[] | null {
  if (!Array.isArray(value)) return null;

  return mergeDefaultsById(
    value.map((link) => ({
      ...defaultDependencyLinkForm,
      ...(isRecord(link) ? link : {}),
      visible: !isRecord(link) || link.visible !== false,
    } as DependencyLink)),
    defaultDependencyLinks,
  );
}

export function dependencyLinkFormNodePatch(nodes: DependencyNode[]) {
  if (!nodes[0]) return null;

  return {
    fromNodeId: nodes[0].id,
    toNodeId: nodes[1]?.id ?? nodes[0].id,
  };
}
