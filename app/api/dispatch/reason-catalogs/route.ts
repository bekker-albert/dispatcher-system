import { NextResponse } from "next/server";

import {
  loadDispatchReasonCatalogsFromMysql,
  saveDispatchReasonCatalogsToMysql,
} from "@/lib/server/mysql/dispatch-reason-catalogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalogs = await loadDispatchReasonCatalogsFromMysql();
    return NextResponse.json({ catalogs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось загрузить справочники." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const catalogs = await saveDispatchReasonCatalogsToMysql(body?.catalogs);
    return NextResponse.json({ catalogs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сохранить справочники." },
      { status: 500 },
    );
  }
}
