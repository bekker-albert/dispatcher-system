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

  return (
    <SectionCard title="Пользователь">
      <div style={{ ...blockStyle, maxWidth: 520 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>{user.displayName || userCard.fullName}</div>
        <div style={{ color: "#64748b", marginTop: 6 }}>{authRoleLabels[user.role]}</div>
        <div style={{ marginTop: 10 }}>Логин: {user.login}</div>
        <div>Подразделение: {userCard.department}</div>
        <div>Права доступа: {user.canManageUsers ? "Управление пользователями" : userCard.access}</div>
      </div>
      {user.canManageUsers ? <UserManagementPanel /> : null}
    </SectionCard>
  );
}

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  background: "#f8fafc",
};
