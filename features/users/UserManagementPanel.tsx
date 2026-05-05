"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

import { authRoleLabels, type AuthUserListItem, type AuthUserRole } from "@/lib/domain/auth/types";

type UserListResponse = {
  users?: AuthUserListItem[];
  error?: string;
};

const panelStyle: CSSProperties = {
  marginTop: 16,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 16,
};

const inputStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "9px 10px",
  fontSize: 14,
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

  return (
    <section style={panelStyle}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>Пользователи</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
        Создание пользователей доступно начальнику диспетчерской службы и тем, кому выдано это право.
      </div>

      <form onSubmit={createUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 180px auto", gap: 8, marginTop: 14 }}>
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
        <label style={{ display: "flex", alignItems: "center", gap: 8, gridColumn: "1 / -1", fontSize: 13 }}>
          <input type="checkbox" checked={canManageUsers} onChange={(event) => setCanManageUsers(event.target.checked)} />
          Может создавать пользователей и выдавать это право другим
        </label>
      </form>

      {message ? <div style={{ marginTop: 10, color: "#334155", fontSize: 13 }}>{message}</div> : null}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={cellStyle}>Логин</th>
            <th style={cellStyle}>Имя</th>
            <th style={cellStyle}>Роль</th>
            <th style={cellStyle}>Создание пользователей</th>
            <th style={cellStyle}>Статус</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={cellStyle}>{user.login}</td>
              <td style={cellStyle}>{user.displayName}</td>
              <td style={cellStyle}>{authRoleLabels[user.role]}</td>
              <td style={cellStyle}>{user.canManageUsers ? "Да" : "Нет"}</td>
              <td style={cellStyle}>{user.active ? "Активен" : "Отключен"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
