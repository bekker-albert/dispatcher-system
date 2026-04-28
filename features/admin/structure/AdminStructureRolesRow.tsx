import { Fragment } from "react";
import { Check, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { orgMemberLabel, type OrgMember } from "@/lib/domain/admin/structure";
import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, VehicleMeta } from "@/shared/ui/layout";

import { AdminStructureRolesEditForm } from "./AdminStructureRolesEditForm";
import { actionButtonsStyle, detailCellStyle, primaryTextStyle } from "./AdminStructureRolesStyles";
import type { UpdateOrgMember } from "./AdminStructureRolesTypes";

type AdminStructureRolesRowProps = {
  member: OrgMember;
  orgMembers: OrgMember[];
  isEditing: boolean;
  onEditOrgMember: (id: string | null) => void;
  onUpdateOrgMember: UpdateOrgMember;
  onDeleteOrgMember: (id: string) => void;
};

export function AdminStructureRolesRow({
  member,
  orgMembers,
  isEditing,
  onEditOrgMember,
  onUpdateOrgMember,
  onDeleteOrgMember,
}: AdminStructureRolesRowProps) {
  const managerOptions = orgMembers.filter((candidate) => candidate.id !== member.id);
  const linearManager = orgMembers.find((candidate) => candidate.id === member.linearManagerId);
  const functionalManager = orgMembers.find((candidate) => candidate.id === member.functionalManagerId);

  return (
    <Fragment>
      <tr>
        <CompactTd>
          <div style={primaryTextStyle}>{member.name || "Без названия"}</div>
          <VehicleMeta label="Должность" value={member.position} />
        </CompactTd>
        <CompactTd>
          <VehicleMeta label="Отдел" value={member.department} />
          <VehicleMeta label="Участок" value={member.area} />
        </CompactTd>
        <CompactTd>{orgMemberLabel(linearManager)}</CompactTd>
        <CompactTd>{orgMemberLabel(functionalManager)}</CompactTd>
        <CompactTd>{member.active ? "Активен" : "Скрыт"}</CompactTd>
        <CompactTd>
          <div style={actionButtonsStyle}>
            <IconButton
              label={isEditing ? "Завершить редактирование" : "Редактировать связь"}
              onClick={() => onEditOrgMember(isEditing ? null : member.id)}
            >
              {isEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
            </IconButton>
            <IconButton
              label={member.active ? "Скрыть из структуры" : "Вернуть в структуру"}
              onClick={() => onUpdateOrgMember(member.id, "active", !member.active)}
            >
              {member.active ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </IconButton>
            <IconButton label="Удалить связь" onClick={() => onDeleteOrgMember(member.id)}>
              <Trash2 size={16} aria-hidden />
            </IconButton>
          </div>
        </CompactTd>
      </tr>
      {isEditing && (
        <tr>
          <td colSpan={6} style={detailCellStyle}>
            <AdminStructureRolesEditForm
              member={member}
              managerOptions={managerOptions}
              onUpdateOrgMember={onUpdateOrgMember}
            />
          </td>
        </tr>
      )}
    </Fragment>
  );
}
