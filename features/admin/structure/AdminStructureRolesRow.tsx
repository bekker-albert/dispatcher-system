import { Fragment } from "react";

import { orgMemberLabel, type OrgMember } from "@/lib/domain/admin/structure";
import { CompactTd, VehicleMeta } from "@/shared/ui/layout";

import { AdminStructureRolesEditForm } from "./AdminStructureRolesEditForm";
import { AdminStructureRowActions } from "./AdminStructureRowActions";
import { detailCellStyle, primaryTextStyle } from "./AdminStructureRolesStyles";
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
          <AdminStructureRowActions
            deleteLabel="Удалить связь"
            editLabel="Редактировать связь"
            finishEditLabel="Завершить редактирование"
            hiddenIconLabel="Вернуть в структуру"
            isEditing={isEditing}
            visible={member.active}
            visibleIconLabel="Скрыть из структуры"
            onDelete={() => onDeleteOrgMember(member.id)}
            onToggleEdit={() => onEditOrgMember(isEditing ? null : member.id)}
            onToggleVisible={() => onUpdateOrgMember(member.id, "active", !member.active)}
          />
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
