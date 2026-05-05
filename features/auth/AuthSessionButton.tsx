"use client";

import { LogOut, Pencil, UserCircle } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { authRoleLabels } from "@/lib/domain/auth/types";
import { useAuth } from "./AuthContext";

type AuthSessionButtonProps = {
  onOpenProfile: () => void;
};

const wrapperStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
};

const triggerStyle: CSSProperties = {
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "7px 8px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  boxSizing: "border-box",
};

const userNameStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const popupStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 6px)",
  zIndex: 300,
  width: 280,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  boxShadow: "0 16px 36px rgba(15, 23, 42, 0.16)",
  padding: 12,
};

const popupHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  paddingBottom: 10,
  borderBottom: "1px solid #e2e8f0",
};

const avatarStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  flex: "0 0 auto",
};

const titleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 14,
  lineHeight: 1.2,
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  marginTop: 3,
};

const detailsStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "10px 0",
  fontSize: 12,
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const detailLabelStyle: CSSProperties = {
  color: "#64748b",
};

const detailValueStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
  textAlign: "right",
  overflowWrap: "anywhere",
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  paddingTop: 10,
  borderTop: "1px solid #e2e8f0",
};

const actionButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "8px 10px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
};

export function AuthSessionButton({ onOpenProfile }: AuthSessionButtonProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const openProfile = () => {
    setOpen(false);
    onOpenProfile();
  };

  return (
    <div className="app-auth-session" ref={rootRef} style={wrapperStyle}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={triggerStyle}
        title="Профиль"
        aria-label="Профиль пользователя"
        aria-expanded={open}
      >
        <UserCircle size={17} aria-hidden />
        <span style={userNameStyle}>{user.displayName}</span>
      </button>

      {open ? (
        <div role="dialog" aria-label="Карточка пользователя" style={popupStyle}>
          <div style={popupHeaderStyle}>
            <div style={avatarStyle}>{getInitials(user.displayName)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={titleStyle}>{user.displayName}</div>
              <div style={mutedStyle}>{authRoleLabels[user.role]}</div>
            </div>
          </div>

          <div style={detailsStyle}>
            <ProfileDetail label="Логин" value={user.login} />
            <ProfileDetail label="Права" value={user.canManageUsers ? "Администратор" : "Пользователь"} />
          </div>

          <div style={actionsStyle}>
            <button type="button" onClick={openProfile} style={actionButtonStyle} title="Редактировать профиль">
              <Pencil size={14} aria-hidden />
              <span>Профиль</span>
            </button>
            <button type="button" onClick={() => void logout()} style={actionButtonStyle} title="Выйти">
              <LogOut size={14} aria-hidden />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "П";
  const second = parts[1]?.[0] ?? "";

  return `${first}${second}`.toUpperCase();
}
