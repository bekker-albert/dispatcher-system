import { type OrgMember } from "@/lib/domain/admin/structure";

import { AdminStructureRoleFields } from "./AdminStructureRoleFields";
import { inlineEditStyle } from "./AdminStructureRolesStyles";
import type { UpdateOrgMember } from "./AdminStructureRolesTypes";

type AdminStructureRolesEditFormProps = {
  member: OrgMember;
  managerOptions: OrgMember[];
  onUpdateOrgMember: UpdateOrgMember;
};

export function AdminStructureRolesEditForm({
  member,
  managerOptions,
  onUpdateOrgMember,
}: AdminStructureRolesEditFormProps) {
  return (
    <div style={inlineEditStyle}>
      <AdminStructureRoleFields
        member={member}
        managerOptions={managerOptions}
        onUpdate={(field, value) => onUpdateOrgMember(member.id, field, value)}
      />
    </div>
  );
}
