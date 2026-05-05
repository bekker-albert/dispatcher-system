"use client";

import type { CSSProperties } from "react";

import { SectionCard } from "../../shared/ui/layout";

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
  return (
    <SectionCard title="Пользователь">
      <div style={{ ...blockStyle, maxWidth: 520 }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>{userCard.fullName}</div>
        <div style={{ color: "#64748b", marginTop: 6 }}>{userCard.role}</div>
        <div style={{ marginTop: 10 }}>Подразделение: {userCard.department}</div>
        <div>Права доступа: {userCard.access}</div>
      </div>
    </SectionCard>
  );
}

const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};
