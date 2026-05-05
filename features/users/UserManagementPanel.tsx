"use client";

import { Ban, Check, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  authRoleLabels,
  formatAuthDisplayName,
  normalizeAuthTabPermissions,
  type AuthUserListItem,
  type AuthUserRole,
} from "@/lib/domain/auth/types";
import { createEmptyDraft, createPayload, formatDateTime, manageableTabs, type UserEditDraft } from "./UserManagementModel";
import {
  actionCellStyle,
  buttonStyle,
  cellStyle,
  checkboxLabelStyle,
  compactInputStyle,
  dangerIconButtonStyle,
  editGridStyle,
  formStyle,
  iconButtonStyle,
  inputStyle,
  panelStyle,
  permissionGridStyle,
  selectedPanelStyle,
  tableStyle,
  tableWrapStyle,
} from "./UserManagementStyles";
import { UserPermissionRow } from "./UserPermissionRow";

type UserListResponse = {
  users?: AuthUserListItem[];
  user?: AuthUserListItem;
  error?: string;
};

export function UserManagementPanel() {
  const [users, setUsers] = useState<AuthUserListItem[]>([]);
  const [createDraft, setCreateDraft] = useState<UserEditDraft>(() => createEmptyDraft());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UserEditDraft | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [editingUserId, users],
  );

  const loadUsers = async () => {
    const response = await fetch("/api/auth/users", { headers: { "X-Dispatcher-Request": "same-origin" } });
    const body = await response.json().catch(() => ({})) as UserListResponse;
    if (!response.ok) {
      setMessage(body.error || "Не удалось загрузить пользователей");
      return;
    }

    setUsers(body.users ?? []);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify(createPayload(createDraft)),
    });
    const body = await response.json().catch(() => ({})) as UserListResponse;
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error || "Пользователь не создан");
      return;
    }

    setCreateDraft(createEmptyDraft());
    setMessage("Пользователь создан");
    await loadUsers();
  };

  const startEdit = (user: AuthUserListItem) => {
    setEditingUserId(user.id);
    setEditDraft({
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      email: user.email,
      phone: user.phone,
      positionTitle: user.positionTitle,
      password: "",
      role: user.role,
      canManageUsers: user.canManageUsers,
      active: user.active,
      tabPermissions: normalizeAuthTabPermissions(user.tabPermissions),
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editDraft || !selectedUser) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/users", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({ id: selectedUser.id, ...createPayload(editDraft) }),
    });
    const body = await response.json().catch(() => ({})) as UserListResponse;
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error || "Пользователь не сохранен");
      return;
    }

    setMessage("Пользователь сохранен");
    cancelEdit();
    await loadUsers();
  };

  const toggleActive = async (user: AuthUserListItem) => {
    setLoading(true);
    setMessage("");

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
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error || "Статус пользователя не изменен");
      return;
    }

    setMessage(user.active ? "Пользователь заблокирован" : "Пользователь разблокирован");
    await loadUsers();
  };

  const deleteUser = async (user: AuthUserListItem) => {
    if (!window.confirm(`Удалить пользователя ${user.displayName}?`)) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({ id: user.id }),
    });
    const body = await response.json().catch(() => ({})) as UserListResponse;
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error || "Пользователь не удален");
      return;
    }

    if (editingUserId === user.id) cancelEdit();
    setMessage("Пользователь удален");
    await loadUsers();
  };

  const updateCreateDraft = (patch: Partial<UserEditDraft>) => {
    setCreateDraft((current) => ({ ...current, ...patch }));
  };

  const updateEditDraft = (patch: Partial<UserEditDraft>) => {
    setEditDraft((current) => current ? { ...current, ...patch } : current);
  };

  return (
    <section style={panelStyle}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>Журнал пользователей</div>

      <form onSubmit={createUser} style={formStyle}>
        <input value={createDraft.login ?? ""} onChange={(event) => updateCreateDraft({ login: event.target.value })} placeholder="Логин" style={inputStyle} />
        <input value={createDraft.lastName} onChange={(event) => updateCreateDraft({ lastName: event.target.value })} placeholder="Фамилия" style={inputStyle} />
        <input value={createDraft.firstName} onChange={(event) => updateCreateDraft({ firstName: event.target.value })} placeholder="Имя" style={inputStyle} />
        <input value={createDraft.middleName} onChange={(event) => updateCreateDraft({ middleName: event.target.value })} placeholder="Отчество" style={inputStyle} />
        <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.65 : 1 }}>
          Создать
        </button>
        <input value={createDraft.email} onChange={(event) => updateCreateDraft({ email: event.target.value })} placeholder="Почта" style={inputStyle} />
        <input value={createDraft.phone} onChange={(event) => updateCreateDraft({ phone: event.target.value })} placeholder="Телефон" style={inputStyle} />
        <input value={createDraft.positionTitle} onChange={(event) => updateCreateDraft({ positionTitle: event.target.value })} placeholder="Должность" style={inputStyle} />
        <input value={createDraft.password} onChange={(event) => updateCreateDraft({ password: event.target.value })} placeholder="Пароль" type="password" style={inputStyle} />
        <select value={createDraft.role} onChange={(event) => updateCreateDraft({ role: event.target.value as AuthUserRole })} style={inputStyle}>
          <option value="dispatcher">Диспетчер</option>
          <option value="dispatch-chief">Начальник ДС</option>
          <option value="admin">Администратор</option>
        </select>
        <label style={{ ...checkboxLabelStyle, gridColumn: "1 / -1" }}>
          <input
            type="checkbox"
            checked={createDraft.canManageUsers}
            onChange={(event) => updateCreateDraft({ canManageUsers: event.target.checked })}
          />
          Может создавать пользователей и выдавать это право другим
        </label>
      </form>

      {message ? <div style={{ marginTop: 10, color: "#334155", fontSize: 13 }}>{message}</div> : null}

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>Создан</th>
              <th style={cellStyle}>Логин</th>
              <th style={cellStyle}>Фамилия Имя Отчество</th>
              <th style={cellStyle}>Почта</th>
              <th style={cellStyle}>Роль</th>
              <th style={cellStyle}>Статус</th>
              <th style={actionCellStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={cellStyle}>{formatDateTime(user.createdAt)}</td>
                <td style={cellStyle}>{user.login}</td>
                <td style={cellStyle}>{user.displayName}</td>
                <td style={cellStyle}>{user.email || "—"}</td>
                <td style={cellStyle}>{authRoleLabels[user.role]}</td>
                <td style={cellStyle}>{user.active ? "Активен" : "Заблокирован"}</td>
                <td style={actionCellStyle}>
                  <button type="button" onClick={() => startEdit(user)} style={iconButtonStyle} title="Редактировать">
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
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && editDraft ? (
        <div style={selectedPanelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Редактирование: {selectedUser.displayName}</div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>ФИО из карточки используется как имя в профиле и в верхнем меню.</div>
            </div>
            <div style={{ whiteSpace: "nowrap" }}>
              <button type="button" onClick={() => void saveEdit()} disabled={loading} style={iconButtonStyle} title="Сохранить">
                <Check size={15} aria-hidden />
              </button>
              <button type="button" onClick={cancelEdit} style={iconButtonStyle} title="Отменить">
                <X size={15} aria-hidden />
              </button>
            </div>
          </div>

          <div style={editGridStyle}>
            <input value={editDraft.lastName} onChange={(event) => updateEditDraft({ lastName: event.target.value })} placeholder="Фамилия" style={compactInputStyle} />
            <input value={editDraft.firstName} onChange={(event) => updateEditDraft({ firstName: event.target.value })} placeholder="Имя" style={compactInputStyle} />
            <input value={editDraft.middleName} onChange={(event) => updateEditDraft({ middleName: event.target.value })} placeholder="Отчество" style={compactInputStyle} />
            <input value={formatAuthDisplayName(editDraft)} readOnly title="Отображаемое имя" style={{ ...compactInputStyle, background: "#eef2f7" }} />
            <input value={editDraft.email} onChange={(event) => updateEditDraft({ email: event.target.value })} placeholder="Почта" style={compactInputStyle} />
            <input value={editDraft.phone} onChange={(event) => updateEditDraft({ phone: event.target.value })} placeholder="Телефон" style={compactInputStyle} />
            <input value={editDraft.positionTitle} onChange={(event) => updateEditDraft({ positionTitle: event.target.value })} placeholder="Должность" style={compactInputStyle} />
            <input value={editDraft.password} onChange={(event) => updateEditDraft({ password: event.target.value })} placeholder="Новый пароль" type="password" style={compactInputStyle} />
            <select value={editDraft.role} onChange={(event) => updateEditDraft({ role: event.target.value as AuthUserRole })} style={compactInputStyle}>
              <option value="dispatcher">Диспетчер</option>
              <option value="dispatch-chief">Начальник ДС</option>
              <option value="admin">Администратор</option>
            </select>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={editDraft.canManageUsers}
                onChange={(event) => updateEditDraft({ canManageUsers: event.target.checked })}
              />
              Управление пользователями
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={editDraft.active}
                onChange={(event) => updateEditDraft({ active: event.target.checked })}
              />
              Активен
            </label>
          </div>

          <div style={{ fontWeight: 900, marginTop: 14 }}>Доступ по вкладкам</div>
          <div style={permissionGridStyle}>
            <div style={{ color: "#64748b", fontSize: 12 }}>Вкладка</div>
            <div style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>Просмотр</div>
            <div style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>Редакт.</div>
            {manageableTabs.map((tab) => {
              const access = editDraft.tabPermissions[tab.id] ?? { view: false, edit: false };
              return (
                <UserPermissionRow
                  key={tab.id}
                  label={tab.label}
                  access={access}
                  onChange={(nextAccess) => updateEditDraft({
                    tabPermissions: {
                      ...editDraft.tabPermissions,
                      [tab.id]: nextAccess,
                    },
                  })}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
