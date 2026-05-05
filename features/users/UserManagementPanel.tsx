"use client";

import { Check, Pencil, X } from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

import { authRoleLabels, type AuthUserListItem, type AuthUserRole } from "@/lib/domain/auth/types";

type UserListResponse = {
  users?: AuthUserListItem[];
  user?: AuthUserListItem;
  error?: string;
};

type UserEditDraft = {
  displayName: string;
  password: string;
  role: AuthUserRole;
  canManageUsers: boolean;
  active: boolean;
};

const panelStyle: CSSProperties = {
  marginTop: 16,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 16,
};

const formStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(160px, 1fr) minmax(180px, 1fr) minmax(160px, 1fr) 180px auto",
  gap: 8,
  marginTop: 14,
  alignItems: "center",
};

const inputStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "9px 10px",
  fontSize: 14,
  minWidth: 0,
};

const compactInputStyle: CSSProperties = {
  ...inputStyle,
  padding: "7px 8px",
  fontSize: 12,
  width: "100%",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 14,
  fontSize: 13,
};

const cellStyle: CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  padding: "8px 6px",
  textAlign: "left",
  verticalAlign: "middle",
};

const actionCellStyle: CSSProperties = {
  ...cellStyle,
  width: 92,
  textAlign: "right",
};

const iconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  marginLeft: 4,
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
};

export function UserManagementPanel() {
  const [users, setUsers] = useState<AuthUserListItem[]>([]);
  const [login, setLogin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AuthUserRole>("dispatcher");
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UserEditDraft | null>(null);

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
      body: JSON.stringify({ login, displayName, password, role, canManageUsers }),
    });
    const body = await response.json().catch(() => ({})) as UserListResponse;
    setLoading(false);

    if (!response.ok) {
      setMessage(body.error || "Пользователь не создан");
      return;
    }

    setLogin("");
    setDisplayName("");
    setPassword("");
    setRole("dispatcher");
    setCanManageUsers(false);
    setMessage("Пользователь создан");
    await loadUsers();
  };

  const startEdit = (user: AuthUserListItem) => {
    setEditingUserId(user.id);
    setEditDraft({
      displayName: user.displayName,
      password: "",
      role: user.role,
      canManageUsers: user.canManageUsers,
      active: user.active,
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditDraft(null);
  };

  const saveEdit = async (user: AuthUserListItem) => {
    if (!editDraft) return;

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
        displayName: editDraft.displayName,
        password: editDraft.password,
        role: editDraft.role,
        canManageUsers: editDraft.canManageUsers,
        active: editDraft.active,
      }),
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

  const updateDraft = (patch: Partial<UserEditDraft>) => {
    setEditDraft((current) => current ? { ...current, ...patch } : current);
  };

  return (
    <section style={panelStyle}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>Пользователи</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
        Журнал созданных учетных записей, добавление пользователей и редактирование их прав.
      </div>

      <form onSubmit={createUser} style={formStyle}>
        <input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Логин" style={inputStyle} />
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Имя" style={inputStyle} />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" type="password" style={inputStyle} />
        <select value={role} onChange={(event) => setRole(event.target.value as AuthUserRole)} style={inputStyle}>
          <option value="dispatcher">Диспетчер</option>
          <option value="dispatch-chief">Начальник ДС</option>
          <option value="admin">Администратор</option>
        </select>
        <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.65 : 1 }}>
          Создать
        </button>
        <label style={{ ...checkboxLabelStyle, gridColumn: "1 / -1" }}>
          <input type="checkbox" checked={canManageUsers} onChange={(event) => setCanManageUsers(event.target.checked)} />
          Может создавать пользователей и выдавать это право другим
        </label>
      </form>

      {message ? <div style={{ marginTop: 10, color: "#334155", fontSize: 13 }}>{message}</div> : null}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Создан</th>
            <th style={cellStyle}>Логин</th>
            <th style={cellStyle}>Имя</th>
            <th style={cellStyle}>Роль</th>
            <th style={cellStyle}>Права</th>
            <th style={cellStyle}>Статус</th>
            <th style={actionCellStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const editing = editingUserId === user.id && editDraft;

            return (
              <tr key={user.id}>
                <td style={cellStyle}>{formatDateTime(user.createdAt)}</td>
                <td style={cellStyle}>{user.login}</td>
                <td style={cellStyle}>
                  {editing ? (
                    <input
                      value={editDraft.displayName}
                      onChange={(event) => updateDraft({ displayName: event.target.value })}
                      style={compactInputStyle}
                    />
                  ) : user.displayName}
                </td>
                <td style={cellStyle}>
                  {editing ? (
                    <select
                      value={editDraft.role}
                      onChange={(event) => updateDraft({ role: event.target.value as AuthUserRole })}
                      style={compactInputStyle}
                    >
                      <option value="dispatcher">Диспетчер</option>
                      <option value="dispatch-chief">Начальник ДС</option>
                      <option value="admin">Администратор</option>
                    </select>
                  ) : authRoleLabels[user.role]}
                </td>
                <td style={cellStyle}>
                  {editing ? (
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={editDraft.canManageUsers}
                        onChange={(event) => updateDraft({ canManageUsers: event.target.checked })}
                      />
                      Управление
                    </label>
                  ) : user.canManageUsers ? "Управление пользователями" : "Обычный доступ"}
                </td>
                <td style={cellStyle}>
                  {editing ? (
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={editDraft.active}
                        onChange={(event) => updateDraft({ active: event.target.checked })}
                      />
                      Активен
                    </label>
                  ) : user.active ? "Активен" : "Отключен"}
                  {editing ? (
                    <input
                      value={editDraft.password}
                      onChange={(event) => updateDraft({ password: event.target.value })}
                      placeholder="Новый пароль"
                      type="password"
                      style={{ ...compactInputStyle, marginTop: 6 }}
                    />
                  ) : null}
                </td>
                <td style={actionCellStyle}>
                  {editing ? (
                    <>
                      <button type="button" onClick={() => void saveEdit(user)} disabled={loading} style={iconButtonStyle} title="Сохранить">
                        <Check size={15} aria-hidden />
                      </button>
                      <button type="button" onClick={cancelEdit} style={iconButtonStyle} title="Отменить">
                        <X size={15} aria-hidden />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => startEdit(user)} style={iconButtonStyle} title="Редактировать">
                      <Pencil size={15} aria-hidden />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
