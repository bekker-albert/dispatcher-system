import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AuthRegistrationRequest, AuthRegistrationRequestStatus } from "@/lib/domain/auth/types";
import { formatAuthDisplayName } from "@/lib/domain/auth/types";

import { hashPassword } from "./password";
import { authExecute, authRows } from "./schema";
import { createAuthUserFromPasswordHash, findAuthUserByLogin } from "./users";

type RegistrationRequestRecord = RowDataPacket & {
  request_id: string;
  login: string;
  display_name: string;
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position_title?: string | null;
  password_hash: string;
  status: string;
  reviewed_by_user_id?: string | null;
  reviewed_by_display_name?: string | null;
  decision_comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CreateRegistrationRequestInput = {
  login: string;
  password: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  positionTitle?: string;
};

type DecideRegistrationRequestInput = {
  id: string;
  decision: "approve" | "reject";
  actorUserId: string;
  actorDisplayName: string;
  comment?: string;
};

const registrationSelect = `
  SELECT
    request_id,
    login,
    display_name,
    last_name,
    first_name,
    middle_name,
    email,
    phone,
    position_title,
    password_hash,
    status,
    reviewed_by_user_id,
    reviewed_by_display_name,
    decision_comment,
    created_at,
    updated_at
  FROM auth_registration_requests
`;

function createRequestId() {
  return `reg_${randomBytes(12).toString("hex")}`;
}

function normalizeText(value: string | undefined | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function normalizeStatus(value: string): AuthRegistrationRequestStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

function toRegistrationRequest(record: RegistrationRequestRecord): AuthRegistrationRequest {
  return {
    id: record.request_id,
    login: record.login,
    displayName: record.display_name,
    lastName: normalizeText(record.last_name),
    firstName: normalizeText(record.first_name),
    middleName: normalizeText(record.middle_name),
    email: normalizeText(record.email),
    phone: normalizeText(record.phone),
    positionTitle: normalizeText(record.position_title),
    status: normalizeStatus(record.status),
    reviewedByUserId: record.reviewed_by_user_id ?? undefined,
    reviewedByDisplayName: record.reviewed_by_display_name ?? undefined,
    decisionComment: normalizeText(record.decision_comment),
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
  };
}

async function loadRegistrationRequestRecord(id: string) {
  const rows = await authRows<RegistrationRequestRecord>(
    `${registrationSelect}
    WHERE request_id = ?
    LIMIT 1`,
    [id],
  );

  return rows[0] ?? null;
}

async function hasPendingRegistrationRequest(login: string) {
  const rows = await authRows<RegistrationRequestRecord>(
    `${registrationSelect}
    WHERE login = ? AND status = 'pending'
    LIMIT 1`,
    [normalizeLogin(login)],
  );

  return rows.length > 0;
}

export async function createRegistrationRequest(input: CreateRegistrationRequestInput) {
  const login = normalizeLogin(input.login);
  const lastName = normalizeText(input.lastName);
  const firstName = normalizeText(input.firstName);
  const middleName = normalizeText(input.middleName);
  const email = normalizeText(input.email);
  const phone = normalizeText(input.phone);
  const positionTitle = normalizeText(input.positionTitle);

  if (!login) throw new Error("Логин обязателен");
  if (input.password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");
  if (!lastName) throw new Error("Фамилия обязательна");
  if (!firstName) throw new Error("Имя обязательно");
  if (!email && !phone) throw new Error("Укажите почту или телефон");
  if (await findAuthUserByLogin(login)) throw new Error("Пользователь с таким логином уже существует");
  if (await hasPendingRegistrationRequest(login)) throw new Error("Заявка с таким логином уже ожидает согласования");

  const requestId = createRequestId();
  const displayName = formatAuthDisplayName({ lastName, firstName, middleName, login });
  await authExecute(
    `INSERT INTO auth_registration_requests
      (
        request_id,
        login,
        display_name,
        last_name,
        first_name,
        middle_name,
        email,
        phone,
        position_title,
        password_hash,
        status
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      requestId,
      login,
      displayName,
      lastName,
      firstName,
      middleName,
      email,
      phone,
      positionTitle,
      await hashPassword(input.password),
    ],
  );

  const record = await loadRegistrationRequestRecord(requestId);
  if (!record) throw new Error("Заявка не создана");

  return toRegistrationRequest(record);
}

export async function listRegistrationRequests() {
  const rows = await authRows<RegistrationRequestRecord>(
    `${registrationSelect}
    ORDER BY status = 'pending' DESC, created_at DESC`,
  );

  return rows.map(toRegistrationRequest);
}

export async function decideRegistrationRequest(input: DecideRegistrationRequestInput) {
  const request = await loadRegistrationRequestRecord(input.id);
  if (!request) throw new Error("Заявка не найдена");
  if (normalizeStatus(request.status) !== "pending") throw new Error("Заявка уже обработана");

  if (input.decision === "approve") {
    if (await findAuthUserByLogin(request.login)) {
      throw new Error("Пользователь с таким логином уже существует");
    }

    await createAuthUserFromPasswordHash({
      login: request.login,
      passwordHash: request.password_hash,
      displayName: request.display_name,
      lastName: normalizeText(request.last_name),
      firstName: normalizeText(request.first_name),
      middleName: normalizeText(request.middle_name),
      email: normalizeText(request.email),
      phone: normalizeText(request.phone),
      positionTitle: normalizeText(request.position_title),
      role: "dispatcher",
      canManageUsers: false,
      tabPermissions: {},
    });
  }

  const status: AuthRegistrationRequestStatus = input.decision === "approve" ? "approved" : "rejected";
  await authExecute(
    `UPDATE auth_registration_requests
      SET status = ?,
          reviewed_by_user_id = ?,
          reviewed_by_display_name = ?,
          decision_comment = ?
      WHERE request_id = ?`,
    [
      status,
      input.actorUserId,
      input.actorDisplayName,
      normalizeText(input.comment),
      input.id,
    ],
  );

  const updated = await loadRegistrationRequestRecord(input.id);
  if (!updated) throw new Error("Заявка не найдена");

  return toRegistrationRequest(updated);
}
