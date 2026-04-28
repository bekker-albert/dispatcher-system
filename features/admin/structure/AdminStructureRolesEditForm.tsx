import { orgMemberLabel, type OrgMember } from "@/lib/domain/admin/structure";
import { Field } from "@/shared/ui/layout";

import { inlineEditStyle, inputStyle } from "./AdminStructureRolesStyles";
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
      <Field label="Сотрудник / роль">
        <input
          value={member.name}
          onChange={(event) => onUpdateOrgMember(member.id, "name", event.target.value)}
          placeholder="Например: Диспетчер смены"
          style={inputStyle}
        />
      </Field>
      <Field label="Должность">
        <input
          value={member.position}
          onChange={(event) => onUpdateOrgMember(member.id, "position", event.target.value)}
          placeholder="Например: Диспетчер"
          style={inputStyle}
        />
      </Field>
      <Field label="Подразделение">
        <input
          value={member.department}
          onChange={(event) => onUpdateOrgMember(member.id, "department", event.target.value)}
          placeholder="Например: ПТО"
          style={inputStyle}
        />
      </Field>
      <Field label="Участок">
        <input
          value={member.area}
          onChange={(event) => onUpdateOrgMember(member.id, "area", event.target.value)}
          placeholder="Например: Аксу"
          style={inputStyle}
        />
      </Field>
      <Field label="Линейный руководитель">
        <select
          value={member.linearManagerId}
          onChange={(event) => onUpdateOrgMember(member.id, "linearManagerId", event.target.value)}
          style={inputStyle}
        >
          <option value="">Не назначен</option>
          {managerOptions.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {orgMemberLabel(candidate)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Функциональный руководитель">
        <select
          value={member.functionalManagerId}
          onChange={(event) => onUpdateOrgMember(member.id, "functionalManagerId", event.target.value)}
          style={inputStyle}
        >
          <option value="">Не назначен</option>
          {managerOptions.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {orgMemberLabel(candidate)}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
