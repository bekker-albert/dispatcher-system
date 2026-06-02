import { NextResponse } from "next/server";

import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { getWialonRequestErrorResponse, requireWialonAdmin } from "@/lib/server/wialon/route-guard";
import { syncWialonPositions } from "@/lib/server/wialon/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const rejected = await requireWialonAdmin(request);
  if (rejected) return rejected;

  try {
    return NextResponse.json({
      result: await syncWialonPositions(),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return getWialonRequestErrorResponse(error);
  }
}
