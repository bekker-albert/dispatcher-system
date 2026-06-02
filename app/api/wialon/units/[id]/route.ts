import { NextResponse } from "next/server";

import { getLiveWialonUnit } from "@/lib/server/wialon/service";
import { getWialonRequestErrorResponse, requireWialonAdmin } from "@/lib/server/wialon/route-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const rejected = await requireWialonAdmin(request);
  if (rejected) return rejected;

  const { id } = await context.params;
  const unitId = Number(id);
  if (!Number.isFinite(unitId) || unitId <= 0) {
    return NextResponse.json({ error: "Некорректный Wialon unit id" }, { status: 400 });
  }

  try {
    return NextResponse.json({ unit: await getLiveWialonUnit(unitId) });
  } catch (error) {
    return getWialonRequestErrorResponse(error);
  }
}
