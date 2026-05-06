import { NextResponse } from "next/server";

import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { createRegistrationRequest } from "@/lib/server/auth/registration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterRequestBody = {
  login?: unknown;
  password?: unknown;
  lastName?: unknown;
  firstName?: unknown;
  middleName?: unknown;
  email?: unknown;
  phone?: unknown;
  positionTitle?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const body = await request.json().catch(() => ({})) as RegisterRequestBody;
  try {
    const registrationRequest = await createRegistrationRequest({
      login: getString(body.login),
      password: getString(body.password),
      lastName: getString(body.lastName),
      firstName: getString(body.firstName),
      middleName: getString(body.middleName),
      email: getString(body.email),
      phone: getString(body.phone),
      positionTitle: getString(body.positionTitle),
    });

    return NextResponse.json({ request: registrationRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Заявка не создана";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
