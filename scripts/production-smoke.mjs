const baseUrl = (process.env.PRODUCTION_SMOKE_URL || "https://aam-dispatch.kz").replace(/\/+$/, "");
const defaultApiBaseUrl = new URL(baseUrl).hostname === "aam-dispatch.kz"
  ? "https://www.aam-dispatch.kz"
  : baseUrl;
const apiBaseUrl = (
  process.env.PRODUCTION_SMOKE_API_URL
  || defaultApiBaseUrl
).replace(/\/+$/, "");
const timeoutMsRaw = process.env.PRODUCTION_SMOKE_TIMEOUT_MS || "30000";
const timeoutMs = Number(timeoutMsRaw);
const smokeAuthLogin = process.env.PRODUCTION_SMOKE_AUTH_LOGIN || "";
const smokeAuthPassword = process.env.PRODUCTION_SMOKE_AUTH_PASSWORD || "";
const siteOrigin = new URL(baseUrl).origin;

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error("PRODUCTION_SMOKE_TIMEOUT_MS must be a positive number");
}

console.log(`site url: ${baseUrl}`);
console.log(`api url: ${apiBaseUrl}`);

async function smokeFetch(url, init = {}) {
  return await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function checkUrl(label, url, validate) {
  const response = await smokeFetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "dispatcher-production-smoke/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }

  await validate(response);
  console.log(`${label}: OK`);
}

await checkUrl("site", baseUrl, async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error("site response is not HTML");
  }
});

await checkUrl("database status", `${apiBaseUrl}/api/database`, async (response) => {
  const payload = await response.json();
  const status = payload?.data ?? payload;
  if (!status || typeof status !== "object") {
    throw new Error("database status response has unexpected shape");
  }
  if (status.provider !== "mysql") {
    throw new Error(`database status returned unexpected provider: ${String(status.provider)}`);
  }
  if (status.configured !== true) {
    throw new Error("database status reports MySQL is not configured");
  }
});

async function checkAnonymousDatabaseWriteBlocked() {
  const response = await smokeFetch(`${apiBaseUrl}/api/database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": siteOrigin,
      "Referer": `${siteOrigin}/`,
      "X-Dispatcher-Request": "same-origin",
      "User-Agent": "dispatcher-production-smoke/1.0",
    },
    body: JSON.stringify({
      resource: "taxation",
      action: "list-waybills",
      payload: {
        scope: { sectionId: "baktai" },
      },
    }),
  });

  if (response.status !== 401 && response.status !== 403) {
    throw new Error(`anonymous database POST returned HTTP ${response.status}; expected 401 or 403`);
  }

  console.log("anonymous database POST blocked: OK");
}

await checkAnonymousDatabaseWriteBlocked();

async function checkAuthenticatedPlannedModuleAction() {
  const smokeAuthCookie = await getSmokeAuthCookie();
  if (!smokeAuthCookie) {
    console.log("authenticated planned module action: SKIPPED (PRODUCTION_SMOKE_AUTH_LOGIN/PASSWORD are not set)");
    return;
  }

  const response = await smokeFetch(`${apiBaseUrl}/api/database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": siteOrigin,
      "Referer": `${siteOrigin}/`,
      "X-Dispatcher-Request": "same-origin",
      "User-Agent": "dispatcher-production-smoke/1.0",
      "Cookie": smokeAuthCookie,
    },
    body: JSON.stringify({
      resource: "taxation",
      action: "list-waybills",
      payload: {
        scope: { sectionId: "baktai" },
      },
    }),
  });

  if (response.status !== 501) {
    throw new Error(`authenticated planned module action returned HTTP ${response.status}; expected 501`);
  }

  const body = await response.json();
  const payload = body?.data ?? body;

  if (payload.code !== "planned_module_database_action") {
    throw new Error("planned API response has unexpected code");
  }
  if (payload.endpoint !== "/api/database") {
    throw new Error("planned API response must use the shared database route");
  }
  if (payload.routeKind !== "single-database-router") {
    throw new Error("planned API response must stay on one router");
  }
  if (payload.liveHandler?.status !== "planned-only") {
    throw new Error("planned API response must not be live");
  }
  if (payload.readQuery?.serverPaginated !== true) {
    throw new Error("planned list action must require server pagination");
  }
  if (payload.readQuery?.noClientFullScan !== true) {
    throw new Error("planned list action must forbid client full scans");
  }
  if (payload.readQuery?.maxPageSize > 100) {
    throw new Error("planned list action max page size must stay bounded");
  }

  console.log("authenticated planned module action: OK");
}

let smokeAuthCookiePromise = null;

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const header = response.headers.get("set-cookie");
  return header ? [header] : [];
}

async function getSmokeAuthCookie() {
  if (!smokeAuthLogin || !smokeAuthPassword) return "";

  smokeAuthCookiePromise = smokeAuthCookiePromise ?? (async () => {
    const response = await smokeFetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": siteOrigin,
        "Referer": `${siteOrigin}/`,
        "X-Dispatcher-Request": "same-origin",
        "User-Agent": "dispatcher-production-smoke/1.0",
      },
      body: JSON.stringify({ login: smokeAuthLogin, password: smokeAuthPassword }),
    });

    if (!response.ok) {
      throw new Error(`auth login returned HTTP ${response.status}`);
    }

    const cookie = getSetCookieHeaders(response)
      .map((value) => value.split(";")[0])
      .filter(Boolean)
      .join("; ");
    if (!cookie) throw new Error("auth login did not return a session cookie");

    console.log("auth login: OK");
    return cookie;
  })();

  return await smokeAuthCookiePromise;
}

await checkAuthenticatedPlannedModuleAction();
