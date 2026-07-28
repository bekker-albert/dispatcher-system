import { NextResponse } from "next/server";

import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";
import { authenticateAuthUser, updateAuthUser } from "@/lib/server/auth/users";
import {
  checkAuthActionRateLimit,
  createAuthActionRateLimitKey,
  recordAuthActionAttempt,
} from "@/lib/server/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PasswordChangeBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
  confirmPassword?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const session = await getAuthSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Сессия завершена. Войдите заново." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as PasswordChangeBody;
  const currentPassword = text(body.currentPassword);
  const newPassword = text(body.newPassword);
  const confirmPassword = text(body.confirmPassword);

  const rateLimitKey = createAuthActionRateLimitKey(request, "password-change", session.user.login);
  const rateLimit = checkAuthActionRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }
  recordAuthActionAttempt(rateLimitKey);

  if (!currentPassword) {
    return NextResponse.json({ error: "Введите текущий пароль." }, { status: 400 });
  }
  if (newPassword.length < 12) {
    return NextResponse.json({ error: "Новый пароль должен содержать не менее 12 символов." }, { status: 400 });
  }
  if (!/[A-ZА-ЯЁ]/.test(newPassword) || !/[a-zа-яё]/.test(newPassword) || !/\d/.test(newPassword)) {
    return NextResponse.json(
      { error: "Добавьте в новый пароль заглавную букву, строчную букву и цифру." },
      { status: 400 },
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Подтверждение нового пароля не совпадает." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "Новый пароль должен отличаться от текущего." }, { status: 400 });
  }

  const verifiedUser = await authenticateAuthUser(session.user.login, currentPassword);
  if (!verifiedUser || verifiedUser.id !== session.user.id) {
    return NextResponse.json({ error: "Текущий пароль указан неверно." }, { status: 400 });
  }

  await updateAuthUser({ id: session.user.id, password: newPassword });

  return NextResponse.json({ ok: true, message: "Пароль изменён." });
}
