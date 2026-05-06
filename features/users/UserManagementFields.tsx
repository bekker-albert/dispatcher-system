"use client";

import { authRoleLabels, formatAuthDisplayName, type AuthUserRole } from "@/lib/domain/auth/types";
import type { CSSProperties } from "react";

import { manageableTabs, type UserEditDraft } from "./UserManagementModel";
import {
  checkboxLabelStyle,
  compactInputStyle,
  permissionGridStyle,
} from "./UserManagementStyles";
import { UserPermissionRow } from "./UserPermissionRow";

type UserDraftFieldsProps = {
  draft: UserEditDraft;
  includeLogin?: boolean;
  loginReadOnly?: boolean;
  includeActive?: boolean;
  onChange: (patch: Partial<UserEditDraft>) => void;
};

export function UserDraftFields({
  draft,
  includeLogin = false,
  loginReadOnly = false,
  includeActive = false,
  onChange,
}: UserDraftFieldsProps) {
  return (
    <div style={editGridStyle}>
      {includeLogin ? (
        <input
          value={draft.login ?? ""}
          onChange={(event) => onChange({ login: event.target.value })}
          placeholder="Логин"
          readOnly={loginReadOnly}
          style={loginReadOnly ? readOnlyInputStyle : compactInputStyle}
        />
      ) : null}
      <input value={draft.password} onChange={(event) => onChange({ password: event.target.value })} placeholder={includeLogin ? "Пароль" : "Новый пароль"} type="password" style={compactInputStyle} />
      <select value={draft.role} onChange={(event) => onChange({ role: event.target.value as AuthUserRole })} style={compactInputStyle}>
        {(Object.entries(authRoleLabels) as [AuthUserRole, string][]).map(([role, label]) => (
          <option key={role} value={role}>{label}</option>
        ))}
      </select>
      <input value={draft.lastName} onChange={(event) => onChange({ lastName: event.target.value })} placeholder="Фамилия" style={{ ...compactInputStyle, gridColumn: "1 / 2" }} />
      <input value={draft.firstName} onChange={(event) => onChange({ firstName: event.target.value })} placeholder="Имя" style={compactInputStyle} />
      <input value={draft.middleName} onChange={(event) => onChange({ middleName: event.target.value })} placeholder="Отчество" style={compactInputStyle} />
      <input value={draft.positionTitle} onChange={(event) => onChange({ positionTitle: event.target.value })} placeholder="Должность" style={{ ...compactInputStyle, gridColumn: "1 / 2" }} />
      <input value={draft.email} onChange={(event) => onChange({ email: event.target.value })} placeholder="Почта" style={compactInputStyle} />
      <input value={draft.phone} onChange={(event) => onChange({ phone: event.target.value })} placeholder="Телефон" style={compactInputStyle} />
      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={draft.canManageUsers}
          onChange={(event) => onChange({ canManageUsers: event.target.checked })}
        />
        Управление пользователями
      </label>
      {includeActive ? (
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => onChange({ active: event.target.checked })}
          />
          Активен
        </label>
      ) : null}
    </div>
  );
}

export function PermissionEditor({
  draft,
  onChange,
}: {
  draft: UserEditDraft;
  onChange: (patch: Partial<UserEditDraft>) => void;
}) {
  return (
    <>
      <div style={permissionTitleStyle}>Доступ по вкладкам</div>
      <div style={permissionGridStyle}>
        <div style={permissionHeaderStyle}>Вкладка</div>
        <div style={{ ...permissionHeaderStyle, textAlign: "center" }}>Просмотр</div>
        <div style={{ ...permissionHeaderStyle, textAlign: "center" }}>Редакт.</div>
        {manageableTabs.map((tab) => {
          const access = draft.tabPermissions[tab.id] ?? { view: false, edit: false };
          return (
            <UserPermissionRow
              key={tab.id}
              label={tab.label}
              access={access}
              onChange={(nextAccess) => onChange({
                tabPermissions: {
                  ...draft.tabPermissions,
                  [tab.id]: nextAccess,
                },
              })}
            />
          );
        })}
      </div>
    </>
  );
}

export function formatDisplayNameDescription(draft: UserEditDraft) {
  const displayName = formatAuthDisplayName(draft);
  return displayName || "заполните ФИО";
}

const editGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
  gap: 8,
};

const readOnlyInputStyle: CSSProperties = {
  ...compactInputStyle,
  background: "#eef2f7",
  color: "#475569",
};

const permissionTitleStyle: CSSProperties = {
  fontWeight: 900,
  marginTop: 14,
};

const permissionHeaderStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
};
