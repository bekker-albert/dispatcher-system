import { Plus } from "lucide-react";

import { type OrgMember } from "@/lib/domain/admin/structure";
import { IconButton } from "@/shared/ui/buttons";

import { AdminStructureRoleFields } from "./AdminStructureRoleFields";
import { addFormStyle } from "./AdminStructureRolesStyles";
import type { UpdateOrgMemberForm } from "./AdminStructureRolesTypes";

type AdminStructureRolesAddFormProps = {
  orgMembers: OrgMember[];
  orgMemberForm: OrgMember;
  onUpdateOrgMemberForm: UpdateOrgMemberForm;
  onAddOrgMember: () => void;
};

export function AdminStructureRolesAddForm({
  orgMembers,
  orgMemberForm,
  onUpdateOrgMemberForm,
  onAddOrgMember,
}: AdminStructureRolesAddFormProps) {
  return (
    <div style={addFormStyle}>
      <AdminStructureRoleFields
        member={orgMemberForm}
        managerOptions={orgMembers}
        onUpdate={onUpdateOrgMemberForm}
      />
      <IconButton label="Добавить связь" onClick={onAddOrgMember}>
        <Plus size={16} aria-hidden />
      </IconButton>
    </div>
  );
}
