"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { authRoleLabels, formatAuthDisplayName, type AuthUser } from "@/lib/domain/auth/types";
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

type ProfileDraft = {
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  phone: string;
  positionTitle: string;
};

type UserSaveResponse = {
  user?: AuthUser;
  error?: string;
};

export function UserProfileSection({ userCard }: UserProfileSectionProps) {
  const { user, updateCurrentUser } = useAuth();
  const canManageUsers = user.canManageUsers;
  const [editingSelf, setEditingSelf] = useState(false);
  const [savingSelf, setSavingSelf] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<ProfileDraft>(() => createProfileDraft(user));

  const startEditSelf = () => {
    setDraft(createProfileDraft(user));
    setMessage("");
    setEditingSelf(true);
  };

  const cancelEditSelf = () => {
    setDraft(createProfileDraft(user));
    setEditingSelf(false);
    setMessage("");
  };

  const saveSelf = async () => {
    setSavingSelf(true);
    setMessage("");

    const response = await fetch("/api/auth/users", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({
        id: user.id,
        ...draft,
        displayName: formatAuthDisplayName(draft),
      }),
    });
    const body = await response.json().catch(() => ({})) as UserSaveResponse;
    setSavingSelf(false);

    if (!response.ok || !body.user) {
      setMessage(body.error || "Профиль не сохранен");
      return;
    }

    updateCurrentUser(body.user);
    setEditingSelf(false);
    setMessage("Профиль сохранен");
  };

  return (
    <SectionCard title={canManageUsers ? "Административный профиль" : "Профиль пользователя"}>
      <div style={canManageUsers ? adminLayoutStyle : userLayoutStyle}>
        <div style={leftColumnStyle}>
          <ProfileCard
            user={user}
            userCard={userCard}
            editing={editingSelf}
            draft={draft}
            message={message}
            saving={savingSelf}
            onStartEdit={startEditSelf}
            onCancelEdit={cancelEditSelf}
            onSave={() => void saveSelf()}
            onChangeDraft={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        </div>

        {canManageUsers ? <UserManagementPanel /> : null}
      </div>
    </SectionCard>
  );
}

function ProfileCard({
  user,
  userCard,
  editing,
  draft,
  message,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onChangeDraft,
}: {
  user: AuthUser;
  userCard: UserProfile;
  editing: boolean;
  draft: ProfileDraft;
  message: string;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onChangeDraft: (patch: Partial<ProfileDraft>) => void;
}) {
  const canManageUsers = user.canManageUsers;

  return (
    <div style={cardStyle}>
      <div style={profileHeaderStyle}>
        <div style={avatarStyle}>{getInitials(user.displayName || userCard.fullName)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={nameStyle}>{user.displayName || userCard.fullName}</div>
          <div style={roleStyle}>{authRoleLabels[user.role]}</div>
        </div>
        {editing ? (
          <div style={actionGroupStyle}>
            <button type="button" onClick={onSave} disabled={saving} style={iconButtonStyle} title="Сохранить">
              <Check size={15} aria-hidden />
            </button>
            <button type="button" onClick={onCancelEdit} style={iconButtonStyle} title="Отменить">
              <X size={15} aria-hidden />
            </button>
          </div>
        ) : (
          <button type="button" onClick={onStartEdit} style={iconButtonStyle} title="Редактировать профиль">
            <Pencil size={15} aria-hidden />
          </button>
        )}
      </div>

      {editing ? (
        <div style={editGridStyle}>
          <input value={draft.lastName} onChange={(event) => onChangeDraft({ lastName: event.target.value })} placeholder="Фамилия" style={inputStyle} />
          <input value={draft.firstName} onChange={(event) => onChangeDraft({ firstName: event.target.value })} placeholder="Имя" style={inputStyle} />
          <input value={draft.middleName} onChange={(event) => onChangeDraft({ middleName: event.target.value })} placeholder="Отчество" style={inputStyle} />
          <input value={draft.email} onChange={(event) => onChangeDraft({ email: event.target.value })} placeholder="Почта" style={inputStyle} />
          <input value={draft.phone} onChange={(event) => onChangeDraft({ phone: event.target.value })} placeholder="Телефон" style={inputStyle} />
          <input value={draft.positionTitle} onChange={(event) => onChangeDraft({ positionTitle: event.target.value })} placeholder="Должность" style={inputStyle} />
        </div>
      ) : (
        <div style={detailsGridStyle}>
          <ProfileField label="Логин" value={user.login} />
          <ProfileField label="Почта" value={user.email || "—"} />
          <ProfileField label="Телефон" value={user.phone || "—"} />
          <ProfileField label="Должность" value={user.positionTitle || userCard.department} />
          <ProfileField
            label="Права доступа"
            value={canManageUsers ? "Управление пользователями" : userCard.access}
          />
          <ProfileField label="Тип карточки" value={canManageUsers ? "Администратор" : "Пользователь"} />
        </div>
      )}

      {message ? <div style={messageStyle}>{message}</div> : null}
    </div>
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

function createProfileDraft(user: AuthUser): ProfileDraft {
  return {
    lastName: user.lastName,
    firstName: user.firstName,
    middleName: user.middleName,
    email: user.email,
    phone: user.phone,
    positionTitle: user.positionTitle,
  };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "П";
  const second = parts[1]?.[0] ?? "";

  return `${first}${second}`.toUpperCase();
}

const adminLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
  gap: 12,
  alignItems: "start",
};

const userLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(280px, 520px)",
  gap: 12,
  alignItems: "start",
};

const leftColumnStyle: CSSProperties = {
  minWidth: 0,
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
  flex: "0 0 auto",
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
  gridTemplateColumns: "1fr",
  gap: 10,
  marginTop: 14,
};

const editGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 8,
  marginTop: 14,
};

const inputStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  minWidth: 0,
  boxSizing: "border-box",
  width: "100%",
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

const iconButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
};

const actionGroupStyle: CSSProperties = {
  display: "inline-flex",
  gap: 6,
};

const messageStyle: CSSProperties = {
  color: "#334155",
  fontSize: 13,
  marginTop: 10,
};
