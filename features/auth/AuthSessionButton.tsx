"use client";

import type { CSSProperties } from "react";

import { useAuth } from "./AuthContext";

const wrapperStyle: CSSProperties = {
  position: "fixed",
  top: 10,
  right: 10,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.94)",
  padding: "6px 8px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
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
