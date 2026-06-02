import { NextResponse } from "next/server";

import { isAuthMutationAllowed, createAuthMutationRejectedResponse } from "@/lib/server/auth/request-guard";
import { requireWialonAdmin, getWialonRequestErrorResponse } from "@/lib/server/wialon/route-guard";
import { syncWialonUnits } from "@/lib/server/wialon/service";
import type { WialonUnitMappingInput } from "@/lib/server/wialon/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SyncUnitsBody = {
  mappingsOnly?: unknown;
  mappings?: unknown;
};

function getMappings(value: unknown): WialonUnitMappingInput[] {
  if (!Array.isArray(value)) return [];

  const mappings: WialonUnitMappingInput[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;

    const raw = item as Record<string, unknown>;
    const wialonUnitId = Number(raw.wialonUnitId);
    const vehicleId = raw.vehicleId === null || raw.vehicleId === "" || raw.vehicleId === undefined
      ? null
      : Number(raw.vehicleId);

    if (!Number.isFinite(wialonUnitId) || wialonUnitId <= 0) return;
    if (vehicleId !== null && !Number.isFinite(vehicleId)) return;

    mappings.push({
        wialonUnitId,
        vehicleId,
        hidden: typeof raw.hidden === "boolean" ? raw.hidden : undefined,
    });
  });

  return mappings;
}

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const rejected = await requireWialonAdmin(request);
  if (rejected) return rejected;

  const body = await request.json().catch(() => ({})) as SyncUnitsBody;

  try {
    const units = await syncWialonUnits(getMappings(body.mappings), body.mappingsOnly === true);
    return NextResponse.json({ units, syncedAt: new Date().toISOString() });
  } catch (error) {
    return getWialonRequestErrorResponse(error);
  }
}
