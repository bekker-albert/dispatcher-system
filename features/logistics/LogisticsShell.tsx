"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type { AuthUser } from "@/lib/domain/auth/types";
import styles from "./logistics-shell.module.css";

type LogisticsShellProps = {
  user: AuthUser;
  children: ReactNode;
};

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  dispatcher: "Диспетчер",
  "dispatch-chief": "Начальник диспетчерской службы",
};

const navItems = [
  { href: "/logistics", label: "Заявки и рейсы", exact: true },
  { href: "/logistics/release", label: "Выпуск" },
  { href: "/logistics/documents", label: "Документы" },
  { href: "/logistics/admin", label: "Настройки", adminOnly: true },
];

function initials(displayName: string, login: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const value = parts.slice(0, 2).map((part) => part[0]).join("");
  return (value || login.slice(0, 2) || "П").toUpperCase();
}

export default function LogisticsShell({ user, children }: LogisticsShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const availableNav = useMemo(
    () => navItems.filter((item) => !item.adminOnly || user.role === "admin" || user.role === "dispatch-chief"),
    [user.role],
  );

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setPasswordOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-dispatcher-request": "same-origin",
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || "Пароль не изменён");

      event.currentTarget.reset();
      setPasswordOpen(false);
      setShowPasswords(false);
      setNotice(payload.message || "Пароль изменён");
      window.setTimeout(() => setNotice(""), 4500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Пароль не изменён");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError("");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "x-dispatcher-request": "same-origin" },
      });
    } finally {
      window.location.href = "/logistics";
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/logistics" className={styles.brand} aria-label="Логистика Газели — главная">
          <span className={styles.logoMark}>AA</span>
          <span>
            <b>Логистика Газели</b>
            <small>AA Mining</small>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Основные разделы">
          {availableNav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? styles.active : ""}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.account} ref={menuRef}>
          <button
            type="button"
            className={styles.accountButton}
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className={styles.avatar}>{initials(user.displayName, user.login)}</span>
            <span className={styles.accountText}>
              <b>{user.displayName}</b>
              <small>{roleLabels[user.role] || user.role}</small>
            </span>
            <span className={styles.chevron}>⌄</span>
          </button>

          {menuOpen ? (
            <div className={styles.accountMenu} role="menu">
              <div className={styles.accountSummary}>
                <b>{user.displayName}</b>
                <span>Логин: {user.login}</span>
                <small>{roleLabels[user.role] || user.role}</small>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setError("");
                  setPasswordOpen(true);
                }}
              >
                Сменить пароль
              </button>
              <button type="button" role="menuitem" onClick={() => void logout()} disabled={busy}>
                Выйти
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {notice ? <div className={styles.notice}>{notice}</div> : null}
      <div className={styles.page}>{children}</div>

      {passwordOpen ? (
        <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && setPasswordOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="password-title">
            <div className={styles.modalHead}>
              <div>
                <h2 id="password-title">Смена пароля</h2>
                <p>Логин: <b>{user.login}</b></p>
              </div>
              <button type="button" className={styles.close} onClick={() => setPasswordOpen(false)} aria-label="Закрыть">×</button>
            </div>

            <form onSubmit={changePassword} className={styles.passwordForm}>
              <label>
                <span>Текущий пароль</span>
                <input name="currentPassword" type={showPasswords ? "text" : "password"} autoComplete="current-password" required autoFocus />
              </label>
              <label>
                <span>Новый пароль</span>
                <input name="newPassword" type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={12} required />
              </label>
              <label>
                <span>Повторите новый пароль</span>
                <input name="confirmPassword" type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={12} required />
              </label>
              <label className={styles.showPassword}>
                <input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} />
                Показать пароль
              </label>
              <p className={styles.passwordHint}>Не менее 12 символов: заглавная и строчная буквы, цифра.</p>
              {error ? <div className={styles.formError}>{error}</div> : null}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setPasswordOpen(false)}>Отмена</button>
                <button type="submit" className={styles.primary} disabled={busy}>{busy ? "Сохраняем…" : "Изменить пароль"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
