"use client";

import { Pencil } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { authRoleLabels, formatAuthDisplayName, type AuthUser } from "@/lib/domain/auth/types";
import { SectionCard } from "../../shared/ui/layout";
import { UserManagementPanel } from "./UserManagementPanel";
import { UserProfileModal } from "./UserProfileModal";

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

  const hasUnsavedSelfChanges = hasProfileDraftChanges(draft, createProfileDraft(user));

  const requestCloseSelf = () => {
    if (savingSelf) return;
    if (hasUnsavedSelfChanges && !window.confirm("Есть несохраненные изменения профиля. Закрыть форму и потерять их?")) {
      return;
    }

    cancelEditSelf();
  };

  const saveSelf = async () => {
    setSavingSelf(true);
    setMessage("");

    try {
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

      if (!response.ok || !body.user) {
        setMessage(body.error || "Профиль не сохранен");
        return;
      }

      updateCurrentUser(body.user);
      setEditingSelf(false);
      setMessage("Профиль сохранен");
    } catch {
      setMessage("Не удалось сохранить профиль");
    } finally {
      setSavingSelf(false);
    }
  };

  return (
    <SectionCard title={canManageUsers ? "Административный профиль" : "Профиль пользователя"}>
      <div style={canManageUsers ? adminLayoutStyle : userLayoutStyle}>
        <div style={leftColumnStyle}>
          <ProfileCard
            user={user}
            userCard={userCard}
            message={message}
            onStartEdit={startEditSelf}
          />
        </div>

        {canManageUsers ? <UserManagementPanel /> : null}
      </div>

      {editingSelf ? (
        <UserProfileModal
          title="Редактирование профиля"
          description="ФИО из карточки используется как имя в верхнем меню."
          disableClose={savingSelf}
          onClose={requestCloseSelf}
          footer={(
            <>
              <button type="button" onClick={requestCloseSelf} style={secondaryButtonStyle}>
                Отмена
              </button>
              <button type="button" onClick={() => void saveSelf()} disabled={savingSelf} style={primaryButtonStyle}>
                Сохранить
              </button>
            </>
          )}
        >
          <div style={editGridStyle}>
            <input value={draft.lastName} onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))} placeholder="Фамилия" style={inputStyle} />
            <input value={draft.firstName} onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))} placeholder="Имя" style={inputStyle} />
            <input value={draft.middleName} onChange={(event) => setDraft((current) => ({ ...current, middleName: event.target.value }))} placeholder="Отчество" style={inputStyle} />
            <input value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Почта" style={inputStyle} />
            <input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Телефон" style={inputStyle} />
            <input value={draft.positionTitle} onChange={(event) => setDraft((current) => ({ ...current, positionTitle: event.target.value }))} placeholder="Должность" style={inputStyle} />
          </div>
        </UserProfileModal>
      ) : null}
    </SectionCard>
  );
}

function ProfileCard({
  user,
  userCard,
  message,
  onStartEdit,
}: {
  user: AuthUser;
  userCard: UserProfile;
  message: string;
  onStartEdit: () => void;
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
        <button type="button" onClick={onStartEdit} style={iconButtonStyle} title="Редактировать профиль">
          <Pencil size={15} aria-hidden />
        </button>
      </div>

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

function hasProfileDraftChanges(left: ProfileDraft, right: ProfileDraft) {
  return left.lastName !== right.lastName
    || left.firstName !== right.firstName
    || left.middleName !== right.middleName
    || left.email !== right.email
    || left.phone !== right.phone
    || left.positionTitle !== right.positionTitle;
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
  gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
  gap: 8,
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

const primaryButtonStyle: CSSProperties = {
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "8px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const messageStyle: CSSProperties = {
  color: "#334155",
  fontSize: 13,
  marginTop: 10,
};
