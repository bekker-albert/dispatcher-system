"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "var(--app-font)",
};

const formStyle: CSSProperties = {
  width: "min(420px, 100%)",
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 24,
  boxShadow: "0 18px 60px rgba(15, 23, 42, 0.10)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "11px 12px",
  fontSize: 15,
  outline: "none",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const buttonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "12px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "#fff1f2",
  color: "#991b1b",
  padding: "10px 12px",
  fontSize: 13,
};

export function LoginScreen() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({ login, password }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };

    if (!response.ok) {
      setError(body.error || "Не удалось войти");
      setSubmitting(false);
      return;
    }

    window.location.reload();
  };

  return (
    <main style={pageStyle}>
      <form onSubmit={submitLogin} style={formStyle}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Вход в диспетчерскую систему</div>
        <div style={{ color: "#64748b", marginTop: 8, marginBottom: 20, fontSize: 14 }}>
          Доступ только для пользователей, созданных начальником диспетчерской службы или уполномоченным пользователем.
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle}>
            Логин
            <input
              autoComplete="username"
              autoFocus
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Пароль
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
            />
          </label>
          {error ? <div style={errorStyle}>{error}</div> : null}
          <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.65 : 1 }}>
            {submitting ? "Проверяем..." : "Войти"}
          </button>
        </div>
      </form>
    </main>
  );
}
