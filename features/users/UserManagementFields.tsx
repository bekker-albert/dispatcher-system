"use client";

import { authRoleLabels, formatAuthDisplayName, type AuthUserRole } from "@/lib/domain/auth/types";
import type { CSSProperties, ReactNode } from "react";

import { manageableTabs, type UserEditDraft } from "./UserManagementModel";
import {
  checkboxLabelStyle,
  compactInputStyle,
  permissionGridStyle,
} from "./UserManagementStyles";
import { UserPermissionRow } from "./UserPermissionRow";
import {
  getUserProfileFieldInputWarning,
  noDigitsInputPattern,
  noDigitsInputTitle,
} from "./UserProfileValidation";

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
        <FormCell label="Логин">
          <input
            required
            autoComplete="username"
            value={draft.login ?? ""}
            onChange={(event) => onChange({ login: event.target.value })}
            readOnly={loginReadOnly}
            style={loginReadOnly ? readOnlyInputStyle : compactInputStyle}
          />
        </FormCell>
      ) : null}
      <FormCell label={includeLogin ? "Пароль" : "Новый пароль"}>
        <input required={includeLogin} autoComplete="new-password" value={draft.password} onChange={(event) => onChange({ password: event.target.value })} type="password" style={compactInputStyle} />
      </FormCell>
      <FormCell label="Роль">
        <select required value={draft.role} onChange={(event) => onChange({ role: event.target.value as AuthUserRole })} style={compactInputStyle}>
          {(Object.entries(authRoleLabels) as [AuthUserRole, string][]).map(([role, label]) => (
            <option key={role} value={role}>{label}</option>
          ))}
        </select>
      </FormCell>
      <FormCell label="Фамилия" warning={getUserProfileFieldInputWarning("lastName", draft.lastName)}>
        <input required pattern={noDigitsInputPattern} title={noDigitsInputTitle} autoComplete="family-name" value={draft.lastName} onChange={(event) => onChange({ lastName: event.target.value })} style={getInputStyle(getUserProfileFieldInputWarning("lastName", draft.lastName))} />
      </FormCell>
      <FormCell label="Имя" warning={getUserProfileFieldInputWarning("firstName", draft.firstName)}>
        <input required pattern={noDigitsInputPattern} title={noDigitsInputTitle} autoComplete="given-name" value={draft.firstName} onChange={(event) => onChange({ firstName: event.target.value })} style={getInputStyle(getUserProfileFieldInputWarning("firstName", draft.firstName))} />
      </FormCell>
      <FormCell label="Отчество" warning={getUserProfileFieldInputWarning("middleName", draft.middleName)}>
        <input required pattern={noDigitsInputPattern} title={noDigitsInputTitle} autoComplete="additional-name" value={draft.middleName} onChange={(event) => onChange({ middleName: event.target.value })} style={getInputStyle(getUserProfileFieldInputWarning("middleName", draft.middleName))} />
      </FormCell>
      <FormCell label="Должность" warning={getUserProfileFieldInputWarning("positionTitle", draft.positionTitle)}>
        <input required pattern={noDigitsInputPattern} title={noDigitsInputTitle} autoComplete="organization-title" value={draft.positionTitle} onChange={(event) => onChange({ positionTitle: event.target.value })} style={getInputStyle(getUserProfileFieldInputWarning("positionTitle", draft.positionTitle))} />
      </FormCell>
      <FormCell label="Почта">
        <input required autoComplete="email" type="email" value={draft.email} onChange={(event) => onChange({ email: event.target.value })} style={compactInputStyle} />
      </FormCell>
      <FormCell label="Телефон">
        <input required autoComplete="tel" value={draft.phone} onChange={(event) => onChange({ phone: event.target.value })} style={compactInputStyle} />
      </FormCell>
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

function FormCell({ label, children, warning = "" }: { label: string; children: ReactNode; warning?: string }) {
  return (
    <label style={formCellStyle}>
      <span>{label}</span>
      {children}
      {warning ? <span aria-live="polite" style={fieldWarningStyle}>{warning}</span> : null}
    </label>
  );
}

function getInputStyle(warning: string): CSSProperties {
  return warning ? invalidInputStyle : compactInputStyle;
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

const formCellStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
};

const invalidInputStyle: CSSProperties = {
  ...compactInputStyle,
  borderColor: "#f87171",
  background: "#fff7f7",
};

const fieldWarningStyle: CSSProperties = {
  color: "#b91c1c",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.25,
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
