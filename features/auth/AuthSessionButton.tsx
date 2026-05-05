"use client";

import { LogOut, UserCircle } from "lucide-react";
import type { CSSProperties } from "react";

import { useAuth } from "./AuthContext";

type AuthSessionButtonProps = {
  onOpenProfile: () => void;
};

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 4,
  boxShadow: "none",
  boxSizing: "border-box",
  fontSize: 12,
  justifyContent: "space-between",
  width: "100%",
  whiteSpace: "nowrap",
};

const profileButtonStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  borderRadius: 6,
  background: "transparent",
  color: "#0f172a",
  padding: "4px 6px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
};

const userNameStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const logoutButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  padding: "4px 6px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
};

export function AuthSessionButton({ onOpenProfile }: AuthSessionButtonProps) {
  const { user, logout } = useAuth();

  return (
    <div className="app-auth-session" style={wrapperStyle}>
      <button
        type="button"
        onClick={onOpenProfile}
        style={profileButtonStyle}
        title="Открыть карточку пользователя"
        aria-label="Открыть карточку пользователя"
      >
        <UserCircle size={16} aria-hidden />
        <span style={userNameStyle}>{user.displayName}</span>
      </button>
      <button type="button" onClick={() => void logout()} style={logoutButtonStyle} title="Выйти">
        <LogOut size={14} aria-hidden />
        <span>Выйти</span>
      </button>
    </div>
  );
}
