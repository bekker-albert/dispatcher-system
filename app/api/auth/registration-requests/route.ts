import { NextResponse } from "next/server";

import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";
import { decideRegistrationRequest, listRegistrationRequests } from "@/lib/server/auth/registration";
import { mysqlConfigured } from "@/lib/server/mysql/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DecideRegistrationRequestBody = {
  id?: unknown;
  decision?: unknown;
  comment?: unknown;
};

function requireUserManager(session: Awaited<ReturnType<typeof getAuthSessionFromRequest>>) {
  return Boolean(session?.user.canManageUsers);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest(request);
  if (!session || !requireUserManager(session)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  if (!mysqlConfigured()) {
    return NextResponse.json({ requests: [] });
  }

  return NextResponse.json({ requests: await listRegistrationRequests({ status: "pending" }) });
}

export async function PATCH(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const session = await getAuthSessionFromRequest(request);
  if (!session || !requireUserManager(session)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as DecideRegistrationRequestBody;
  const decision = body.decision === "approve" ? "approve" : body.decision === "reject" ? "reject" : null;
  if (!decision) {
    return NextResponse.json({ error: "Решение должно быть approve или reject" }, { status: 400 });
  }

  try {
    const registrationRequest = await decideRegistrationRequest({
      id: getString(body.id),
      decision,
      actorUserId: session.user.id,
      actorDisplayName: session.user.displayName,
      comment: getString(body.comment),
    });

    return NextResponse.json({ request: registrationRequest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Заявка не обработана";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
