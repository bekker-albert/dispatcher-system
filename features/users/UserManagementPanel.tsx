"use client";

import { Ban, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { type AuthUserListItem } from "@/lib/domain/auth/types";
import {
  createDraftFromUser,
  createEmptyDraft,
  createPayload,
  formatDateTime,
  hasUserDraftChanges,
  type UserEditDraft,
} from "./UserManagementModel";
import {
  actionCellStyle,
  buttonStyle,
  cellStyle,
  dangerIconButtonStyle,
  emptyStateCellStyle,
  iconButtonStyle,
  messageStyle,
  panelStyle,
  secondaryButtonStyle,
  statusBoxStyle,
  tableStyle,
  tableWrapStyle,
  toolbarStyle,
} from "./UserManagementStyles";
import { formatDisplayNameDescription, PermissionEditor, UserDraftFields } from "./UserManagementFields";
import { UserProfileModal } from "./UserProfileModal";
import { UserRegistrationRequestsPanel } from "./UserRegistrationRequestsPanel";

type UserListResponse = {
  users?: AuthUserListItem[];
  user?: AuthUserListItem;
  error?: string;
};

const defaultLoadErrorMessage = "Не удалось загрузить пользователей";

export function UserManagementPanel() {
  const { user: currentUser, updateCurrentUser } = useAuth();
  const [users, setUsers] = useState<AuthUserListItem[]>([]);
  const [createDraft, setCreateDraft] = useState<UserEditDraft>(() => createEmptyDraft());
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UserEditDraft | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [editingUserId, users],
  );
  const createBaselineDraft = useMemo(() => createEmptyDraft(), []);
  const editBaselineDraft = useMemo(
    () => (selectedUser ? createDraftFromUser(selectedUser) : null),
    [selectedUser],
  );
  const hasUnsavedCreateChanges = hasUserDraftChanges(createDraft, createBaselineDraft);
  const hasUnsavedEditChanges = Boolean(editDraft && editBaselineDraft && hasUserDraftChanges(editDraft, editBaselineDraft));

  const loadUsers = async () => {
    setLoadError("");

    try {
      const response = await fetch("/api/auth/users", { headers: { "X-Dispatcher-Request": "same-origin" } });
      const body = await response.json().catch(() => ({})) as UserListResponse;
      if (!response.ok) {
        setLoadError(body.error || defaultLoadErrorMessage);
        setUsers([]);
        return;
      }

      setUsers(body.users ?? []);
    } catch {
      setLoadError(defaultLoadErrorMessage);
      setUsers([]);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const cancelCreate = () => {
    setCreatingUser(false);
    setCreateDraft(createEmptyDraft());
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditDraft(null);
  };

  const requestCloseCreate = () => {
    if (loading) return;
    if (hasUnsavedCreateChanges && !window.confirm("Есть несохраненные изменения нового пользователя. Закрыть форму и потерять их?")) {
      return;
    }

    cancelCreate();
  };

  const requestCloseEdit = () => {
    if (loading) return;
    if (hasUnsavedEditChanges && !window.confirm("Есть несохраненные изменения пользователя. Закрыть форму и потерять их?")) {
      return;
    }

    cancelEdit();
  };

  const startCreate = () => {
    if (loading) return;
    if (hasUnsavedEditChanges && !window.confirm("Есть несохраненные изменения пользователя. Открыть создание нового пользователя и потерять их?")) {
      return;
    }
    if (creatingUser && hasUnsavedCreateChanges && !window.confirm("Есть несохраненные изменения нового пользователя. Сбросить их и открыть пустую форму?")) {
      return;
    }

    setCreateDraft(createEmptyDraft());
    setEditingUserId(null);
    setEditDraft(null);
    setMessage("");
    setCreatingUser(true);
  };

  const createUser = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify(createPayload(createDraft)),
      });
      const body = await response.json().catch(() => ({})) as UserListResponse;

      if (!response.ok) {
        setMessage(body.error || "Пользователь не создан");
        return;
      }

      setCreateDraft(createEmptyDraft());
      setCreatingUser(false);
      setMessage("Пользователь создан");
      await loadUsers();
    } catch {
      setMessage("Не удалось создать пользователя");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: AuthUserListItem) => {
    if (loading) return;
    if (editingUserId === user.id) return;
    if (creatingUser && hasUnsavedCreateChanges && !window.confirm("Есть несохраненные изменения нового пользователя. Открыть карточку другого пользователя и потерять их?")) {
      return;
    }
    if (hasUnsavedEditChanges && !window.confirm("Есть несохраненные изменения пользователя. Открыть другую карточку и потерять их?")) {
      return;
    }

    setCreatingUser(false);
    setEditingUserId(user.id);
    setEditDraft(createDraftFromUser(user));
    setMessage("");
  };

  const saveEdit = async () => {
    if (!editDraft || !selectedUser) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify({ id: selectedUser.id, ...createPayload(editDraft) }),
      });
      const body = await response.json().catch(() => ({})) as UserListResponse;

      if (!response.ok) {
        setMessage(body.error || "Пользователь не сохранен");
        return;
      }

      if (body.user && body.user.id === currentUser.id) {
        updateCurrentUser(body.user);
      }
      setMessage("Пользователь сохранен");
      cancelEdit();
      await loadUsers();
    } catch {
      setMessage("Не удалось сохранить пользователя");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (user: AuthUserListItem) => {
    setLoading(true);
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
          lastName: user.lastName,
          firstName: user.firstName,
          middleName: user.middleName,
          email: user.email,
          phone: user.phone,
          positionTitle: user.positionTitle,
          role: user.role,
          canManageUsers: user.canManageUsers,
          active: !user.active,
          tabPermissions: user.tabPermissions,
        }),
      });
      const body = await response.json().catch(() => ({})) as UserListResponse;

      if (!response.ok) {
        setMessage(body.error || "Статус пользователя не изменен");
        return;
      }

      setMessage(user.active ? "Пользователь заблокирован" : "Пользователь разблокирован");
      await loadUsers();
    } catch {
      setMessage("Не удалось изменить статус пользователя");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (user: AuthUserListItem) => {
    if (!window.confirm(`Удалить пользователя ${user.displayName}?`)) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify({ id: user.id }),
      });
      const body = await response.json().catch(() => ({})) as UserListResponse;

      if (!response.ok) {
        setMessage(body.error || "Пользователь не удален");
        return;
      }

      if (editingUserId === user.id) cancelEdit();
      setMessage("Пользователь удален");
      await loadUsers();
    } catch {
      setMessage("Не удалось удалить пользователя");
    } finally {
      setLoading(false);
    }
  };

  const updateCreateDraft = (patch: Partial<UserEditDraft>) => {
    setCreateDraft((current) => ({ ...current, ...patch }));
  };

  const updateEditDraft = (patch: Partial<UserEditDraft>) => {
    setEditDraft((current) => current ? { ...current, ...patch } : current);
  };

  return (
    <>
      <UserRegistrationRequestsPanel onApproved={loadUsers} />
      <section style={panelStyle}>
      <div style={toolbarStyle}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Журнал пользователей</div>
        <button type="button" onClick={startCreate} disabled={loading || initialLoading} style={buttonStyle} title="Создать пользователя">
          <Plus size={15} aria-hidden />
          <span>Создать</span>
        </button>
      </div>

      {message ? <div style={messageStyle}>{message}</div> : null}

      {initialLoading ? (
        <div style={statusBoxStyle}>Загружаем пользователей...</div>
      ) : loadError ? (
        <div style={statusBoxStyle}>
          <div>{loadError}</div>
          <button type="button" onClick={() => void loadUsers()} disabled={loading} style={secondaryButtonStyle}>
            Повторить загрузку
          </button>
        </div>
      ) : (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={cellStyle}>Создан</th>
                <th style={cellStyle}>Логин</th>
                <th style={cellStyle}>Фамилия Имя Отчество</th>
                <th style={cellStyle}>Почта</th>
                <th style={cellStyle}>Статус</th>
                <th style={actionCellStyle}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id}>
                  <td style={cellStyle}>{formatDateTime(user.createdAt)}</td>
                  <td style={cellStyle}>{user.login}</td>
                  <td style={cellStyle}>{user.displayName}</td>
                  <td style={cellStyle}>{user.email || "—"}</td>
                  <td style={cellStyle}>{user.active ? "Активен" : "Заблокирован"}</td>
                  <td style={actionCellStyle}>
                    <button type="button" onClick={() => startEdit(user)} disabled={loading} style={iconButtonStyle} title="Редактировать">
                      <Pencil size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(user)}
                      disabled={loading}
                      style={iconButtonStyle}
                      title={user.active ? "Заблокировать" : "Разблокировать"}
                    >
                      <Ban size={15} aria-hidden />
                    </button>
                    <button type="button" onClick={() => void deleteUser(user)} disabled={loading} style={dangerIconButtonStyle} title="Удалить">
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={emptyStateCellStyle}>Пользователи пока не добавлены.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {creatingUser ? (
        <UserProfileModal
          title="Создание пользователя"
          description={formatDisplayNameDescription(createDraft)}
          disableClose={loading}
          onClose={requestCloseCreate}
          footer={(
            <>
              <button type="button" onClick={requestCloseCreate} style={secondaryButtonStyle}>
                Отмена
              </button>
              <button type="button" onClick={() => void createUser()} disabled={loading} style={buttonStyle}>
                Создать
              </button>
            </>
          )}
        >
          <UserDraftFields draft={createDraft} includeLogin onChange={updateCreateDraft} />
          <PermissionEditor draft={createDraft} onChange={updateCreateDraft} />
        </UserProfileModal>
      ) : null}

      {selectedUser && editDraft ? (
        <UserProfileModal
          title={`Редактирование: ${selectedUser.displayName}`}
          description={formatDisplayNameDescription(editDraft)}
          disableClose={loading}
          onClose={requestCloseEdit}
          footer={(
            <>
              <button type="button" onClick={requestCloseEdit} style={secondaryButtonStyle}>
                Отмена
              </button>
              <button type="button" onClick={() => void saveEdit()} disabled={loading} style={buttonStyle}>
                Сохранить
              </button>
            </>
          )}
        >
          <UserDraftFields draft={editDraft} includeLogin loginReadOnly includeActive onChange={updateEditDraft} />
          <PermissionEditor draft={editDraft} onChange={updateEditDraft} />
        </UserProfileModal>
      ) : null}
      </section>
    </>
  );
}
