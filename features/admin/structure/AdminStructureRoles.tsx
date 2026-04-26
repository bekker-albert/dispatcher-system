import { Fragment, type CSSProperties } from "react";
import { Check, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";

import { IconButton } from "@/shared/ui/buttons";
import { CompactTd, CompactTh, Field, VehicleMeta } from "@/shared/ui/layout";
import { orgMemberLabel, type OrgMember } from "@/lib/domain/admin/structure";

type AdminStructureRolesProps = {
  orgMembers: OrgMember[];
  orgMemberForm: OrgMember;
  editingOrgMemberId: string | null;
  onEditOrgMember: (id: string | null) => void;
  onUpdateOrgMember: (id: string, field: keyof OrgMember, value: string | boolean) => void;
  onUpdateOrgMemberForm: (field: keyof OrgMember, value: string | boolean) => void;
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
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Сотрудники и роли</div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <CompactTh>Сотрудник / роль</CompactTh>
              <CompactTh>Подразделение</CompactTh>
              <CompactTh>Линейный руководитель</CompactTh>
              <CompactTh>Функциональный руководитель</CompactTh>
              <CompactTh>Статус</CompactTh>
              <CompactTh>Действия</CompactTh>
            </tr>
          </thead>
          <tbody>
            {orgMembers.map((member) => {
              const isEditing = editingOrgMemberId === member.id;
              const managerOptions = orgMembers.filter((candidate) => candidate.id !== member.id);
              const linearManager = orgMembers.find((candidate) => candidate.id === member.linearManagerId);
              const functionalManager = orgMembers.find((candidate) => candidate.id === member.functionalManagerId);

              return (
                <Fragment key={member.id}>
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
                      <div style={{ display: "flex", gap: 6 }}>
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
                              onChange={(event) =>
                                onUpdateOrgMember(member.id, "linearManagerId", event.target.value)
                              }
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
                              onChange={(event) =>
                                onUpdateOrgMember(member.id, "functionalManagerId", event.target.value)
                              }
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
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

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
    </>
  );
}

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1120,
  borderCollapse: "collapse",
  fontSize: 14,
};

const primaryTextStyle: CSSProperties = {
  fontWeight: 700,
  color: "#0f172a",
};

const detailCellStyle: CSSProperties = {
  padding: 10,
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

const inlineEditStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  alignItems: "end",
};

const addFormStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto",
  gap: 10,
  alignItems: "end",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};
