import { NextResponse } from "next/server";
import { mysqlConfigured } from "@/lib/server/mysql/config";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoDateTableKey } from "@/lib/domain/pto/date-table";
import type { MysqlPtoState } from "@/lib/server/mysql/pto";
import type { MysqlClientSnapshotMeta } from "@/lib/server/mysql/app-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DatabaseRequest = {
  resource?: string;
  action?: string;
  payload?: unknown;
};

const corsAllowedOrigins = new Set([
  "https://aam-dispatch.kz",
  "https://www.aam-dispatch.kz",
]);

function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Vary": "Origin",
  };

  if (corsAllowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }

  return headers;
}

function json(data: unknown, status = 200, request?: Request) {
  return NextResponse.json({ data }, { status, headers: corsHeaders(request) });
}

function errorResponse(error: unknown, request?: Request) {
  const message = error instanceof Error ? error.message : "Database request failed";
  return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders(request) });
}

function payloadRecord(payload: unknown) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  return json({
    provider: "mysql",
    configured: mysqlConfigured(),
  }, 200, request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as DatabaseRequest;
    const { resource, action, payload } = body;

    if (resource === "status" || action === "status") {
      return json({
        provider: "mysql",
        configured: mysqlConfigured(),
      }, 200, request);
    }

    if (resource === "vehicles") {
      const vehicles = await import("@/lib/server/mysql/vehicles");
      const record = payloadRecord(payload);

      if (action === "load") return json(await vehicles.loadVehiclesFromMysql(), 200, request);
      if (action === "save") {
        await vehicles.saveVehiclesToMysql((record.rows ?? []) as VehicleRow[]);
        return json({ ok: true }, 200, request);
      }
      if (action === "replace") {
        await vehicles.replaceVehiclesInMysql((record.rows ?? []) as VehicleRow[]);
        return json({ ok: true }, 200, request);
      }
      if (action === "delete") {
        await vehicles.deleteVehicleFromMysql(Number(record.id));
        return json({ ok: true }, 200, request);
      }
    }

    if (resource === "settings") {
      const settings = await import("@/lib/server/mysql/settings");
      const record = payloadRecord(payload);

      if (action === "load") return json(await settings.loadAppSettingsFromMysql((record.keys ?? []) as string[]), 200, request);
      if (action === "save") {
        await settings.saveAppSettingsToMysql((record.settings ?? {}) as Record<string, unknown>);
        return json({ ok: true }, 200, request);
      }
    }

    if (resource === "app-state") {
      const appState = await import("@/lib/server/mysql/app-state");
      const record = payloadRecord(payload);

      if (action === "load") return json(await appState.loadAppStateFromMysql(), 200, request);
      if (action === "save") {
        await appState.saveAppStateToMysql((record.storage ?? {}) as Record<string, string>);
        return json({ ok: true }, 200, request);
      }
      if (action === "save-client-snapshot") {
        await appState.saveClientAppSnapshotToMysql(
          String(record.clientId ?? ""),
          (record.storage ?? {}) as Record<string, string>,
          (record.meta ?? { reason: "" }) as MysqlClientSnapshotMeta,
        );
        return json({ ok: true }, 200, request);
      }
      if (action === "load-client-snapshots") return json(await appState.loadClientAppSnapshotsFromMysql(), 200, request);
    }

    if (resource === "pto") {
      const pto = await import("@/lib/server/mysql/pto");
      const record = payloadRecord(payload);

      if (action === "load") return json(await pto.loadPtoStateFromMysql(), 200, request);
      if (action === "save") {
        await pto.savePtoStateToMysql((record.state ?? {}) as MysqlPtoState);
        return json({ ok: true }, 200, request);
      }
      if (action === "save-day") {
        await pto.savePtoDayValueToMysql(
          record.table as PtoDateTableKey,
          String(record.rowId ?? ""),
          String(record.day ?? ""),
          record.value === null ? null : Number(record.value),
        );
        return json({ ok: true }, 200, request);
      }
      if (action === "save-days") {
        await pto.savePtoDayValuesToMysql(
          record.table as PtoDateTableKey,
          (record.values ?? []) as Array<{ rowId: string; day: string; value: number | null }>,
        );
        return json({ ok: true }, 200, request);
      }
      if (action === "delete-year") {
        await pto.deletePtoYearFromMysql(String(record.year ?? ""));
        return json({ ok: true }, 200, request);
      }
      if (action === "delete") {
        await pto.deletePtoRowsFromMysql((record.rowIds ?? []) as string[]);
        return json({ ok: true }, 200, request);
      }
      if (action === "save-bucket-row") {
        await pto.savePtoBucketRowToMysql((record.row ?? {}) as PtoBucketRow, Number(record.sortIndex ?? 0));
        return json({ ok: true }, 200, request);
      }
      if (action === "delete-bucket-row") {
        await pto.deletePtoBucketRowFromMysql(String(record.rowKey ?? ""));
        return json({ ok: true }, 200, request);
      }
      if (action === "save-bucket-value") {
        await pto.savePtoBucketValueToMysql(
          String(record.cellKey ?? ""),
          record.value === null ? null : Number(record.value),
        );
        return json({ ok: true }, 200, request);
      }
      if (action === "delete-bucket-values") {
        await pto.deletePtoBucketValuesFromMysql((record.cellKeys ?? []) as string[]);
        return json({ ok: true }, 200, request);
      }
    }

    return NextResponse.json({ error: "Unknown database action" }, { status: 400, headers: corsHeaders(request) });
  } catch (error) {
    return errorResponse(error, request);
  }
}
