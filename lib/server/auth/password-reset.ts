import { randomBytes, randomInt } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AuthPasswordResetChannel } from "@/lib/domain/auth/types";

import { sendAuthCode } from "./code-delivery";
import { hashPassword, verifyPassword } from "./password";
import { authExecute, authRows } from "./schema";
import { findAuthUserByLogin, updateAuthUser } from "./users";

type PasswordResetCodeRecord = RowDataPacket & {
  reset_id: string;
  user_id: string;
  login: string;
  channel: string;
  destination: string;
  code_hash: string;
  expires_at: Date | string;
  consumed_at?: Date | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CreatePasswordResetInput = {
  login: string;
  channel: AuthPasswordResetChannel;
};

type ConfirmPasswordResetInput = {
  login: string;
  code: string;
  password: string;
};

const resetCodeTtlMs = 10 * 60 * 1000;

function createResetId() {
  return `rst_${randomBytes(12).toString("hex")}`;
}

function createNumericCode() {
  return String(randomInt(100000, 1000000));
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function normalizeChannel(value: AuthPasswordResetChannel) {
  return value === "phone" ? "phone" : "email";
}

function getDestination(user: Awaited<ReturnType<typeof findAuthUserByLogin>>, channel: AuthPasswordResetChannel) {
  if (!user || !user.active) return "";
  return channel === "phone" ? user.phone.trim() : user.email.trim();
}

export async function requestPasswordReset(input: CreatePasswordResetInput) {
  const login = normalizeLogin(input.login);
  const channel = normalizeChannel(input.channel);
  const user = await findAuthUserByLogin(login);
  const destination = getDestination(user, channel);

  if (!user || !destination) {
    return {
      accepted: true,
      delivered: false,
      message: "Если пользователь найден, код будет отправлен",
    };
  }

  const code = createNumericCode();
  await authExecute(
    `INSERT INTO auth_password_reset_codes
      (reset_id, user_id, login, channel, destination, code_hash, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      createResetId(),
      user.id,
      login,
      channel,
      destination,
      await hashPassword(code),
      new Date(Date.now() + resetCodeTtlMs),
    ],
  );

  const delivery = await sendAuthCode({
    channel,
    destination,
    code,
    purpose: "password-reset",
  });

  return {
    accepted: true,
    delivered: delivery.delivered,
    message: delivery.message,
    developmentCode: delivery.developmentCode,
  };
}

export async function confirmPasswordReset(input: ConfirmPasswordResetInput) {
  const login = normalizeLogin(input.login);
  const code = input.code.trim();
  if (!login) throw new Error("Логин обязателен");
  if (!/^\d{6}$/.test(code)) throw new Error("Код должен состоять из 6 цифр");
  if (input.password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");

  const rows = await authRows<PasswordResetCodeRecord>(
    `SELECT
       reset_id,
       user_id,
       login,
       channel,
       destination,
       code_hash,
       expires_at,
       consumed_at,
       created_at,
       updated_at
     FROM auth_password_reset_codes
     WHERE login = ?
       AND consumed_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP(3)
     ORDER BY created_at DESC
     LIMIT 5`,
    [login],
  );

  let matched: PasswordResetCodeRecord | null = null;
  for (const row of rows) {
    if (await verifyPassword(code, row.code_hash)) {
      matched = row;
      break;
    }
  }

  if (!matched) throw new Error("Код неверный или истек");

  await updateAuthUser({ id: matched.user_id, password: input.password });
  await authExecute(
    "UPDATE auth_password_reset_codes SET consumed_at = CURRENT_TIMESTAMP(3) WHERE reset_id = ?",
    [matched.reset_id],
  );

  return { ok: true };
}
