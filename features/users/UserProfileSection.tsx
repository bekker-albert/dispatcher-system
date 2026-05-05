"use client";

import type { CSSProperties } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { authRoleLabels } from "@/lib/domain/auth/types";
import { SectionCard } from "../../shared/ui/layout";
import { UserManagementPanel } from "./UserManagementPanel";

type UserProfile = {
  fullName: string;
  role: string;
  department: string;
  access: string;
};

type UserProfileSectionProps = {
  userCard: UserProfile;
};

export function UserProfileSection({ userCard }: UserProfileSectionProps) {
  const { user } = useAuth();
  const canManageUsers = user.canManageUsers;

  return (
    <SectionCard title={canManageUsers ? "Административный профиль" : "Профиль пользователя"}>
      <div style={profileLayoutStyle}>
        <div style={cardStyle}>
          <div style={profileHeaderStyle}>
            <div style={avatarStyle}>{getInitials(user.displayName || userCard.fullName)}</div>
            <div>
              <div style={nameStyle}>{user.displayName || userCard.fullName}</div>
              <div style={roleStyle}>{authRoleLabels[user.role]}</div>
            </div>
          </div>

          <div style={detailsGridStyle}>
            <ProfileField label="Логин" value={user.login} />
            <ProfileField label="Подразделение" value={userCard.department} />
            <ProfileField
              label="Права доступа"
              value={canManageUsers ? "Управление пользователями" : userCard.access}
            />
            <ProfileField label="Тип карточки" value={canManageUsers ? "Администратор" : "Пользователь"} />
          </div>
        </div>

        {canManageUsers ? (
          <div style={adminInfoStyle}>
            <div style={adminInfoTitleStyle}>Администрирование</div>
            <div style={adminInfoTextStyle}>
              Вам доступно создание пользователей и выдача права на управление пользователями.
            </div>
          </div>
        ) : (
          <div style={userInfoStyle}>
            <div style={adminInfoTitleStyle}>Рабочий доступ</div>
            <div style={adminInfoTextStyle}>
              В карточке показаны ваши данные и текущие права. Изменение доступа выполняет пользователь с
              административными правами.
            </div>
          </div>
        )}
      </div>

      {canManageUsers ? <UserManagementPanel /> : null}
    </SectionCard>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div style={fieldStyle}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldValueStyle}>{value}</div>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "П";
  const second = parts[1]?.[0] ?? "";

  return `${first}${second}`.toUpperCase();
}

const profileLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 520px) minmax(260px, 1fr)",
  gap: 12,
  alignItems: "stretch",
};

const cardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  background: "#f8fafc",
};

const profileHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatarStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};

const nameStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 20,
  lineHeight: 1.15,
};

const roleStyle: CSSProperties = {
  color: "#64748b",
  marginTop: 4,
  fontSize: 13,
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 14,
};

const fieldStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: "10px 12px",
};

const fieldLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  marginBottom: 4,
};

const fieldValueStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 13,
  overflowWrap: "anywhere",
};

const adminInfoStyle: CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  background: "#eff6ff",
  padding: 16,
};

const userInfoStyle: CSSProperties = {
  border: "1px solid #dcfce7",
  borderRadius: 8,
  background: "#f0fdf4",
  padding: 16,
};

const adminInfoTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
};

const adminInfoTextStyle: CSSProperties = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.45,
  marginTop: 8,
};
