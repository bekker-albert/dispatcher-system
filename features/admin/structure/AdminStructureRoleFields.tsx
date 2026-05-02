import { orgMemberLabel, type OrgMember } from "@/lib/domain/admin/structure";
import { Field } from "@/shared/ui/layout";

import { inputStyle } from "./AdminStructureSharedStyles";

type AdminStructureRoleFieldsProps = {
  member: OrgMember;
  managerOptions: OrgMember[];
  onUpdate: (field: keyof OrgMember, value: string) => void;
};

export function AdminStructureRoleFields({
  member,
  managerOptions,
  onUpdate,
}: AdminStructureRoleFieldsProps) {
  return (
    <>
      <Field label="Сотрудник / роль">
        <input
          value={member.name}
          onChange={(event) => onUpdate("name", event.target.value)}
          placeholder="Например: Диспетчер смены"
          style={inputStyle}
        />
      </Field>
      <Field label="Должность">
        <input
          value={member.position}
          onChange={(event) => onUpdate("position", event.target.value)}
          placeholder="Например: Диспетчер"
          style={inputStyle}
        />
      </Field>
      <Field label="Подразделение">
        <input
          value={member.department}
          onChange={(event) => onUpdate("department", event.target.value)}
          placeholder="Например: ПТО"
          style={inputStyle}
        />
      </Field>
      <Field label="Участок">
        <input
          value={member.area}
          onChange={(event) => onUpdate("area", event.target.value)}
          placeholder="Например: Аксу"
          style={inputStyle}
        />
      </Field>
      <Field label="Линейный руководитель">
        <select
          value={member.linearManagerId}
          onChange={(event) => onUpdate("linearManagerId", event.target.value)}
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
          onChange={(event) => onUpdate("functionalManagerId", event.target.value)}
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
    </>
  );
}
