import { NextResponse } from "next/server";

import { checkWialonConnection, getWialonAdminSnapshot, listLiveWialonUnits } from "@/lib/server/wialon/service";
import { getWialonRequestErrorResponse, requireWialonAdmin } from "@/lib/server/wialon/route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rejected = await requireWialonAdmin(request);
  if (rejected) return rejected;

  const url = new URL(request.url);
  const source = url.searchParams.get("source");

  if (source === "database") {
    return NextResponse.json(await getWialonAdminSnapshot());
  }

  try {
    if (source === "check") {
      const result = await checkWialonConnection();
      const snapshot = await getWialonAdminSnapshot();
      return NextResponse.json({
        ...result,
        logs: snapshot.logs,
      });
    }

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
