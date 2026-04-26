import { useState } from "react";

import {
  defaultDependencyLinkForm,
  defaultDependencyLinks,
  defaultDependencyNodeForm,
  defaultDependencyNodes,
  defaultOrgMemberForm,
  defaultOrgMembers,
  type DependencyLink,
  type DependencyNode,
  type OrgMember,
} from "@/lib/domain/admin/structure";
import { createId } from "@/lib/utils/id";

export function useAdminStructureState() {
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>(defaultOrgMembers);
  const [orgMemberForm, setOrgMemberForm] = useState<OrgMember>(defaultOrgMemberForm);
  const [editingOrgMemberId, setEditingOrgMemberId] = useState<string | null>(null);
  const [dependencyNodes, setDependencyNodes] = useState<DependencyNode[]>(defaultDependencyNodes);
  const [dependencyLinks, setDependencyLinks] = useState<DependencyLink[]>(defaultDependencyLinks);
  const [dependencyNodeForm, setDependencyNodeForm] = useState<DependencyNode>(defaultDependencyNodeForm);
  const [dependencyLinkForm, setDependencyLinkForm] = useState<DependencyLink>(defaultDependencyLinkForm);
  const [editingDependencyNodeId, setEditingDependencyNodeId] = useState<string | null>(null);
  const [editingDependencyLinkId, setEditingDependencyLinkId] = useState<string | null>(null);

  function updateOrgMember(id: string, field: keyof OrgMember, value: string | boolean) {
    setOrgMembers((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              [field]: value,
            }
          : member,
      ),
    );
  }

  function updateOrgMemberForm(field: keyof OrgMember, value: string | boolean) {
    setOrgMemberForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addOrgMember() {
    const name = orgMemberForm.name.trim();
    const position = orgMemberForm.position.trim();
    if (!name && !position) return;

    const nextMember: OrgMember = {
      ...orgMemberForm,
      id: createId(),
      name: name || position,
      position,
      department: orgMemberForm.department.trim(),
      area: orgMemberForm.area.trim(),
    };

    setOrgMembers((current) => [...current, nextMember]);
    setOrgMemberForm(defaultOrgMemberForm);
    setEditingOrgMemberId(nextMember.id);
  }

  function deleteOrgMember(id: string) {
    setOrgMembers((current) =>
      current
        .filter((member) => member.id !== id)
        .map((member) => ({
          ...member,
          linearManagerId: member.linearManagerId === id ? "" : member.linearManagerId,
          functionalManagerId: member.functionalManagerId === id ? "" : member.functionalManagerId,
        })),
    );
    setEditingOrgMemberId((current) => (current === id ? null : current));
  }

  function updateDependencyNode(id: string, field: keyof DependencyNode, value: string | boolean) {
    setDependencyNodes((current) =>
      current.map((node) => (node.id === id ? { ...node, [field]: value } : node)),
    );
  }

  function updateDependencyNodeForm(field: keyof DependencyNode, value: string | boolean) {
    setDependencyNodeForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDependencyNode() {
    const name = dependencyNodeForm.name.trim();
    if (!name) return;

    const nextNode: DependencyNode = {
      ...dependencyNodeForm,
      id: createId(),
      name,
      kind: dependencyNodeForm.kind.trim(),
      owner: dependencyNodeForm.owner.trim(),
      visible: true,
    };

    setDependencyNodes((current) => [...current, nextNode]);
    setDependencyNodeForm(defaultDependencyNodeForm);
    setEditingDependencyNodeId(nextNode.id);
    setDependencyLinkForm((current) => ({
      ...current,
      toNodeId: nextNode.id,
    }));
  }

  function deleteDependencyNode(id: string) {
    setDependencyNodes((current) => current.filter((node) => node.id !== id));
    setDependencyLinks((current) => current.filter((link) => link.fromNodeId !== id && link.toNodeId !== id));
    setEditingDependencyNodeId((current) => (current === id ? null : current));
    setEditingDependencyLinkId(null);
  }

  function updateDependencyLink(id: string, field: keyof DependencyLink, value: string | boolean) {
    setDependencyLinks((current) =>
      current.map((link) =>
        link.id === id
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  function updateDependencyLinkForm(field: keyof DependencyLink, value: string | boolean) {
    setDependencyLinkForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addDependencyLink() {
    if (!dependencyLinkForm.fromNodeId || !dependencyLinkForm.toNodeId) return;

    const nextLink: DependencyLink = {
      ...dependencyLinkForm,
      id: createId(),
      rule: dependencyLinkForm.rule.trim(),
      owner: dependencyLinkForm.owner.trim(),
      visible: true,
    };

    setDependencyLinks((current) => [...current, nextLink]);
    setDependencyLinkForm((current) => ({
      ...defaultDependencyLinkForm,
      fromNodeId: current.fromNodeId,
      toNodeId: current.toNodeId,
    }));
    setEditingDependencyLinkId(nextLink.id);
  }

  function deleteDependencyLink(id: string) {
    setDependencyLinks((current) => current.filter((link) => link.id !== id));
    setEditingDependencyLinkId((current) => (current === id ? null : current));
  }

  return {
    orgMembers,
    setOrgMembers,
    orgMemberForm,
    setOrgMemberForm,
    editingOrgMemberId,
    setEditingOrgMemberId,
    updateOrgMember,
    updateOrgMemberForm,
    addOrgMember,
    deleteOrgMember,
    dependencyNodes,
    setDependencyNodes,
    dependencyLinks,
    setDependencyLinks,
    dependencyNodeForm,
    setDependencyNodeForm,
    dependencyLinkForm,
    setDependencyLinkForm,
    editingDependencyNodeId,
    setEditingDependencyNodeId,
    editingDependencyLinkId,
    setEditingDependencyLinkId,
    updateDependencyNode,
    updateDependencyNodeForm,
    addDependencyNode,
    deleteDependencyNode,
    updateDependencyLink,
    updateDependencyLinkForm,
    addDependencyLink,
    deleteDependencyLink,
  };
}
