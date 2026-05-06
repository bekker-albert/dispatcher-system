"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

type AuthScreenMode = "login" | "register" | "forgot";
type ResetStep = "request" | "confirm";

type ApiResponse = {
  error?: string;
  message?: string;
  developmentCode?: string;
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "var(--app-font)",
};

const cardStyle: CSSProperties = {
  width: "min(520px, 100%)",
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
  padding: "10px 11px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const buttonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "11px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

const authLinksStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginTop: 14,
};

const messageStyle: CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 8,
  background: "#eff6ff",
  color: "#1e3a8a",
  padding: "10px 12px",
  fontSize: 13,
};

const errorStyle: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "#fff1f2",
  color: "#991b1b",
  padding: "10px 12px",
  fontSize: 13,
};

const logoStyle: CSSProperties = {
  display: "block",
  width: 118,
  height: "auto",
  margin: "0 auto 14px",
};

function createEmptyRegistrationDraft() {
  return {
    login: "",
    password: "",
    lastName: "",
    firstName: "",
    middleName: "",
    positionTitle: "",
    email: "",
    phone: "",
  };
}

export function LoginScreen() {
  const [mode, setMode] = useState<AuthScreenMode>("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [registrationDraft, setRegistrationDraft] = useState(() => createEmptyRegistrationDraft());
  const [resetLogin, setResetLogin] = useState("");
  const [resetChannel, setResetChannel] = useState<"email" | "phone">("email");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode: AuthScreenMode) => {
    setMode(nextMode);
    setMessage("");
    setError("");
    if (nextMode !== "forgot") setResetStep("request");
  };

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dispatcher-Request": "same-origin",
      },
      body: JSON.stringify({ login, password }),
    });
    const body = await response.json().catch(() => ({})) as ApiResponse;

    if (!response.ok) {
      setError(body.error || "Не удалось войти");
      setSubmitting(false);
      return;
    }

    window.location.reload();
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify(registrationDraft),
      });
      const body = await response.json().catch(() => ({})) as ApiResponse;

      if (!response.ok) {
        setError(body.error || "Заявка не отправлена");
        return;
      }

      setRegistrationDraft(createEmptyRegistrationDraft());
      setMessage("Заявка отправлена. Вход будет доступен после согласования начальником ДС.");
    } catch {
      setError("Не удалось отправить заявку");
    } finally {
      setSubmitting(false);
    }
  };

  const requestResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify({ login: resetLogin, channel: resetChannel }),
      });
      const body = await response.json().catch(() => ({})) as ApiResponse;

      if (!response.ok) {
        setError(body.error || "Код не отправлен");
        return;
      }

      setResetStep("confirm");
      setMessage(body.developmentCode
        ? `${body.message || "Код сформирован"}. Локальный код: ${body.developmentCode}`
        : body.message || "Если пользователь найден, код будет отправлен.");
    } catch {
      setError("Не удалось отправить код");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dispatcher-Request": "same-origin",
        },
        body: JSON.stringify({ login: resetLogin, code: resetCode, password: resetPassword }),
      });
      const body = await response.json().catch(() => ({})) as ApiResponse;

      if (!response.ok) {
        setError(body.error || "Пароль не изменен");
        return;
      }

      setResetCode("");
      setResetPassword("");
      setResetStep("request");
      setMode("login");
      setMessage("Пароль изменен. Войдите с новым паролем.");
    } catch {
      setError("Не удалось изменить пароль");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mining-logo.png" alt="AA Mining" style={logoStyle} />
        <div style={{ fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 18 }}>Вход</div>

        {message ? <div style={{ ...messageStyle, marginBottom: 12 }}>{message}</div> : null}
        {error ? <div style={{ ...errorStyle, marginBottom: 12 }}>{error}</div> : null}

        {mode === "login" ? (
          <form onSubmit={submitLogin} style={{ display: "grid", gap: 12 }}>
            <label style={labelStyle}>
              Логин
              <input autoComplete="username" autoFocus value={login} onChange={(event) => setLogin(event.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Пароль
              <input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
            </label>
            <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.65 : 1 }}>
              {submitting ? "Проверяем..." : "Войти"}
            </button>
          </form>
        ) : null}

        {mode === "register" ? (
          <form onSubmit={submitRegistration} style={{ display: "grid", gap: 12 }}>
            <div style={gridStyle}>
              <input value={registrationDraft.login} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, login: event.target.value }))} placeholder="Логин" style={inputStyle} />
              <input value={registrationDraft.password} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, password: event.target.value }))} placeholder="Пароль" type="password" style={inputStyle} />
              <input value={registrationDraft.lastName} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, lastName: event.target.value }))} placeholder="Фамилия" style={inputStyle} />
              <input value={registrationDraft.firstName} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, firstName: event.target.value }))} placeholder="Имя" style={inputStyle} />
              <input value={registrationDraft.middleName} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, middleName: event.target.value }))} placeholder="Отчество" style={inputStyle} />
              <input value={registrationDraft.positionTitle} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, positionTitle: event.target.value }))} placeholder="Должность" style={inputStyle} />
              <input value={registrationDraft.email} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, email: event.target.value }))} placeholder="Почта" style={inputStyle} />
              <input value={registrationDraft.phone} onChange={(event) => setRegistrationDraft((draft) => ({ ...draft, phone: event.target.value }))} placeholder="Телефон" style={inputStyle} />
            </div>
            <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.65 : 1 }}>
              {submitting ? "Отправляем..." : "Отправить заявку"}
            </button>
          </form>
        ) : null}

        {mode === "forgot" ? (
          resetStep === "request" ? (
            <form onSubmit={requestResetCode} style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Логин
                <input autoComplete="username" value={resetLogin} onChange={(event) => setResetLogin(event.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Куда отправить код
                <select value={resetChannel} onChange={(event) => setResetChannel(event.target.value === "phone" ? "phone" : "email")} style={inputStyle}>
                  <option value="email">Почта</option>
                  <option value="phone">Телефон</option>
                </select>
              </label>
              <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.65 : 1 }}>
                {submitting ? "Отправляем..." : "Получить код"}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmResetCode} style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Код
                <input inputMode="numeric" value={resetCode} onChange={(event) => setResetCode(event.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Новый пароль
                <input autoComplete="new-password" type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} style={inputStyle} />
              </label>
              <button type="submit" disabled={submitting} style={{ ...buttonStyle, opacity: submitting ? 0.65 : 1 }}>
                {submitting ? "Сохраняем..." : "Изменить пароль"}
              </button>
              <button type="button" onClick={() => setResetStep("request")} style={linkButtonStyle}>
                Запросить код повторно
              </button>
            </form>
          )
        ) : null}

        {mode !== "login" ? (
          <button type="button" onClick={() => switchMode("login")} style={{ ...linkButtonStyle, display: "block", margin: "12px auto 0" }}>
            Вернуться ко входу
          </button>
        ) : null}

        <div style={authLinksStyle}>
          <button type="button" onClick={() => switchMode("register")} style={linkButtonStyle}>
            Регистрация
          </button>
          <button type="button" onClick={() => switchMode("forgot")} style={linkButtonStyle}>
            Забыл пароль
          </button>
        </div>
      </section>
    </main>
  );
}
