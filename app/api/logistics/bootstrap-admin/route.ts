import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  createAuthUser,
  findAuthUserByLogin,
  updateAuthUser,
} from "@/lib/server/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bootstrapTokenHash = "7e2fe65f4c0b3fa7b9a25d04671b0c3eb3c22a9142febc5439a05805eb854419";

type BootstrapBody = {
  login?: unknown;
  password?: unknown;
};

function tokenMatches(value: string | null) {
  if (!value) return false;
  const supplied = Buffer.from(createHash("sha256").update(value).digest("hex"));
  const expected = Buffer.from(bootstrapTokenHash);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  if (!tokenMatches(request.headers.get("x-logistics-bootstrap-token"))) {
    return NextResponse.json({ error: "Недействительный одноразовый ключ" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as BootstrapBody;
  const login = typeof body.login === "string" ? body.login.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!login) return NextResponse.json({ error: "Логин обязателен" }, { status: 400 });
  if (password.length < 12) {
    return NextResponse.json({ error: "Пароль должен быть не короче 12 символов" }, { status: 400 });
  }

  const existing = await findAuthUserByLogin(login);
  const user = existing
    ? await updateAuthUser({
        id: existing.id,
        password,
        role: "admin",
        canManageUsers: true,
        active: true,
      })
    : await createAuthUser({
        login,
        password,
        displayName: "Администратор логистики",
        lastName: "Администратор",
        firstName: "Логистики",
        middleName: "",
        email: "",
        phone: "",
        positionTitle: "Администратор системы",
        role: "admin",
        canManageUsers: true,
        tabPermissions: {},
      });

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      login: user.login,
      role: user.role,
      active: user.active,
      canManageUsers: user.canManageUsers,
    },
  });
}
