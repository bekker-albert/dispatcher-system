import type { CSSProperties } from "react";

import { TopButton } from "@/shared/ui/buttons";
import { SubTabs } from "@/shared/ui/layout";
import { structureSectionTabs, type StructureSection } from "@/lib/domain/admin/navigation";
import type {
  DependencyLink,
  DependencyNode,
  OrgMember,
} from "@/lib/domain/admin/structure";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import { AdminStructureElements } from "./AdminStructureElements";
import { AdminStructureLinks } from "./AdminStructureLinks";
import { AdminStructureRoles } from "./AdminStructureRoles";
import { AdminStructureSchedule } from "./AdminStructureSchedule";
import { AdminStructureScheme } from "./AdminStructureScheme";

type AdminStructureSectionProps = {
  structureSection: StructureSection;
  onSelectStructureSection: (section: StructureSection) => void;
  dependencyNodes: DependencyNode[];
  dependencyLinks: DependencyLink[];
  dependencyNodeForm: DependencyNode;
  dependencyLinkForm: DependencyLink;
  editingDependencyNodeId: string | null;
  editingDependencyLinkId: string | null;
  onEditDependencyNode: (id: string | null) => void;
  onEditDependencyLink: (id: string | null) => void;
  onUpdateDependencyNode: (id: string, field: keyof DependencyNode, value: string | boolean) => void;
  onUpdateDependencyNodeForm: (field: keyof DependencyNode, value: string | boolean) => void;
  onAddDependencyNode: () => void;
  onDeleteDependencyNode: (id: string) => void;
  onUpdateDependencyLink: (id: string, field: keyof DependencyLink, value: string | boolean) => void;
  onUpdateDependencyLinkForm: (field: keyof DependencyLink, value: string | boolean) => void;
  onAddDependencyLink: () => void;
  onDeleteDependencyLink: (id: string) => void;
  orgMembers: OrgMember[];
  orgMemberForm: OrgMember;
  editingOrgMemberId: string | null;
  onEditOrgMember: (id: string | null) => void;
  onUpdateOrgMember: (id: string, field: keyof OrgMember, value: string | boolean) => void;
  onUpdateOrgMemberForm: (field: keyof OrgMember, value: string | boolean) => void;
  onAddOrgMember: () => void;
  onDeleteOrgMember: (id: string) => void;
  areaShiftScheduleAreas: string[];
  areaShiftCutoffs: AreaShiftCutoffMap;
  onUpdateAreaShiftCutoff: (area: string, value: string) => void;
};

export function AdminStructureSection({
  structureSection,
  onSelectStructureSection,
  dependencyNodes,
  dependencyLinks,
  dependencyNodeForm,
  dependencyLinkForm,
  editingDependencyNodeId,
  editingDependencyLinkId,
  onEditDependencyNode,
  onEditDependencyLink,
  onUpdateDependencyNode,
  onUpdateDependencyNodeForm,
  onAddDependencyNode,
  onDeleteDependencyNode,
  onUpdateDependencyLink,
  onUpdateDependencyLinkForm,
  onAddDependencyLink,
  onDeleteDependencyLink,
  orgMembers,
  orgMemberForm,
  editingOrgMemberId,
  onEditOrgMember,
  onUpdateOrgMember,
  onUpdateOrgMemberForm,
  onAddOrgMember,
  onDeleteOrgMember,
  areaShiftScheduleAreas,
  areaShiftCutoffs,
  onUpdateAreaShiftCutoff,
}: AdminStructureSectionProps) {
  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={{ fontWeight: 700 }}>Структура данных</div>
          <div style={{ color: "#64748b", marginTop: 4 }}>
            Связка: участки, техника, ПТО, объемы, оперучет, маркзамеры и отчетность.
          </div>
        </div>
      </div>

      <SubTabs>
        {structureSectionTabs.map((section) => (
          <TopButton
            key={section.value}
            active={structureSection === section.value}
            onClick={() => onSelectStructureSection(section.value)}
            label={section.label}
          />
        ))}
      </SubTabs>

      {structureSection === "scheme" && (
        <AdminStructureScheme dependencyNodes={dependencyNodes} dependencyLinks={dependencyLinks} />
      )}

      {structureSection === "elements" && (
        <AdminStructureElements
          dependencyNodes={dependencyNodes}
          dependencyNodeForm={dependencyNodeForm}
          editingDependencyNodeId={editingDependencyNodeId}
          onEditDependencyNode={onEditDependencyNode}
          onUpdateDependencyNode={onUpdateDependencyNode}
          onUpdateDependencyNodeForm={onUpdateDependencyNodeForm}
          onAddDependencyNode={onAddDependencyNode}
          onDeleteDependencyNode={onDeleteDependencyNode}
        />
      )}

      {structureSection === "links" && (
        <AdminStructureLinks
          dependencyNodes={dependencyNodes}
          dependencyLinks={dependencyLinks}
          dependencyLinkForm={dependencyLinkForm}
          editingDependencyLinkId={editingDependencyLinkId}
          onEditDependencyLink={onEditDependencyLink}
          onUpdateDependencyLink={onUpdateDependencyLink}
          onUpdateDependencyLinkForm={onUpdateDependencyLinkForm}
          onAddDependencyLink={onAddDependencyLink}
          onDeleteDependencyLink={onDeleteDependencyLink}
        />
      )}

      {structureSection === "roles" && (
        <AdminStructureRoles
          orgMembers={orgMembers}
          orgMemberForm={orgMemberForm}
          editingOrgMemberId={editingOrgMemberId}
          onEditOrgMember={onEditOrgMember}
          onUpdateOrgMember={onUpdateOrgMember}
          onUpdateOrgMemberForm={onUpdateOrgMemberForm}
          onAddOrgMember={onAddOrgMember}
          onDeleteOrgMember={onDeleteOrgMember}
        />
      )}

      {structureSection === "schedule" && (
        <AdminStructureSchedule
          areas={areaShiftScheduleAreas}
          areaShiftCutoffs={areaShiftCutoffs}
          onUpdateAreaShiftCutoff={onUpdateAreaShiftCutoff}
        />
      )}
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
  marginBottom: 16,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 12,
};
