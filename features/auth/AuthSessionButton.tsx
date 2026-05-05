"use client";

import type { CSSProperties } from "react";

import { useAuth } from "./AuthContext";

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: "7px 8px",
  boxShadow: "none",
  boxSizing: "border-box",
  fontSize: 12,
  justifyContent: "space-between",
  width: "100%",
  whiteSpace: "nowrap",
};

const buttonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: "5px 8px",
  cursor: "pointer",
  fontWeight: 700,
};

export function AuthSessionButton() {
  const { user, logout } = useAuth();

  return (
    <div className="app-auth-session" style={wrapperStyle}>
      <span>{user.displayName}</span>
      <button type="button" onClick={() => void logout()} style={buttonStyle}>
        Выйти
      </button>
    </div>
  );
}
