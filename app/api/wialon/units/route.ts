import { NextResponse } from "next/server";

import { getWialonAdminSnapshot, listLiveWialonUnits } from "@/lib/server/wialon/service";
import { getWialonRequestErrorResponse, requireWialonAdmin } from "@/lib/server/wialon/route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rejected = await requireWialonAdmin(request);
  if (rejected) return rejected;

  const url = new URL(request.url);
  if (url.searchParams.get("source") === "database") {
    return NextResponse.json(await getWialonAdminSnapshot());
  }

  try {
    const units = await listLiveWialonUnits();
    const snapshot = await getWialonAdminSnapshot();
    return NextResponse.json({
      units,
      logs: snapshot.logs,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return getWialonRequestErrorResponse(error);
  }
}
