import { CompactTh } from "@/shared/ui/layout";
import type { OrgMember } from "@/lib/domain/admin/structure";

import { AdminStructureRolesAddForm } from "./AdminStructureRolesAddForm";
import { AdminStructureRolesRow } from "./AdminStructureRolesRow";
import { tableHeaderRowStyle, tableStyle, titleStyle } from "./AdminStructureRolesStyles";
import type { UpdateOrgMember, UpdateOrgMemberForm } from "./AdminStructureRolesTypes";

type AdminStructureRolesProps = {
  orgMembers: OrgMember[];
  orgMemberForm: OrgMember;
  editingOrgMemberId: string | null;
  onEditOrgMember: (id: string | null) => void;
  onUpdateOrgMember: UpdateOrgMember;
  onUpdateOrgMemberForm: UpdateOrgMemberForm;
  onAddOrgMember: () => void;
  onDeleteOrgMember: (id: string) => void;
};

export function AdminStructureRoles({
  orgMembers,
  orgMemberForm,
  editingOrgMemberId,
  onEditOrgMember,
  onUpdateOrgMember,
  onUpdateOrgMemberForm,
  onAddOrgMember,
  onDeleteOrgMember,
}: AdminStructureRolesProps) {
  return (
    <>
      <div style={titleStyle}>Сотрудники и роли</div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={tableHeaderRowStyle}>
              <CompactTh>Сотрудник / роль</CompactTh>
              <CompactTh>Подразделение</CompactTh>
              <CompactTh>Линейный руководитель</CompactTh>
              <CompactTh>Функциональный руководитель</CompactTh>
              <CompactTh>Статус</CompactTh>
              <CompactTh>Действия</CompactTh>
            </tr>
          </thead>
          <tbody>
            {orgMembers.map((member) => (
              <AdminStructureRolesRow
                key={member.id}
                member={member}
                orgMembers={orgMembers}
                isEditing={editingOrgMemberId === member.id}
                onEditOrgMember={onEditOrgMember}
                onUpdateOrgMember={onUpdateOrgMember}
                onDeleteOrgMember={onDeleteOrgMember}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AdminStructureRolesAddForm
        orgMembers={orgMembers}
        orgMemberForm={orgMemberForm}
        onUpdateOrgMemberForm={onUpdateOrgMemberForm}
        onAddOrgMember={onAddOrgMember}
      />
    </>
  );
}
