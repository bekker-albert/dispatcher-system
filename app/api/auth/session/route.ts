import { NextResponse } from "next/server";

import { getAuthSessionFromRequest } from "@/lib/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest(request);

  return NextResponse.json({ session });
}
