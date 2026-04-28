import { Plus } from "lucide-react";

import { orgMemberLabel, type OrgMember } from "@/lib/domain/admin/structure";
import { IconButton } from "@/shared/ui/buttons";
import { Field } from "@/shared/ui/layout";

import { addFormStyle, inputStyle } from "./AdminStructureRolesStyles";
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
      <Field label="Сотрудник / роль">
        <input
          value={orgMemberForm.name}
          onChange={(event) => onUpdateOrgMemberForm("name", event.target.value)}
          placeholder="Например: Геолог"
          style={inputStyle}
        />
      </Field>
      <Field label="Должность">
        <input
          value={orgMemberForm.position}
          onChange={(event) => onUpdateOrgMemberForm("position", event.target.value)}
          placeholder="Должность"
          style={inputStyle}
        />
      </Field>
      <Field label="Подразделение">
        <input
          value={orgMemberForm.department}
          onChange={(event) => onUpdateOrgMemberForm("department", event.target.value)}
          placeholder="Отдел"
          style={inputStyle}
        />
      </Field>
      <Field label="Участок">
        <input
          value={orgMemberForm.area}
          onChange={(event) => onUpdateOrgMemberForm("area", event.target.value)}
          placeholder="Участок"
          style={inputStyle}
        />
      </Field>
      <Field label="Линейный руководитель">
        <select
          value={orgMemberForm.linearManagerId}
          onChange={(event) => onUpdateOrgMemberForm("linearManagerId", event.target.value)}
          style={inputStyle}
        >
          <option value="">Не назначен</option>
          {orgMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {orgMemberLabel(member)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Функциональный руководитель">
        <select
          value={orgMemberForm.functionalManagerId}
          onChange={(event) => onUpdateOrgMemberForm("functionalManagerId", event.target.value)}
          style={inputStyle}
        >
          <option value="">Не назначен</option>
          {orgMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {orgMemberLabel(member)}
            </option>
          ))}
        </select>
      </Field>
      <IconButton label="Добавить связь" onClick={onAddOrgMember}>
        <Plus size={16} aria-hidden />
      </IconButton>
    </div>
  );
}
