const baseUrl = (process.env.PRODUCTION_SMOKE_URL || "https://aam-dispatch.kz").replace(/\/+$/, "");
const defaultApiBaseUrl = new URL(baseUrl).hostname === "aam-dispatch.kz"
  ? "https://www.aam-dispatch.kz"
  : baseUrl;
const apiBaseUrl = (
  process.env.PRODUCTION_SMOKE_API_URL
  || defaultApiBaseUrl
).replace(/\/+$/, "");
const minVehicleRowsRaw = process.env.PRODUCTION_SMOKE_MIN_VEHICLE_ROWS || "100";
const minVehicleRows = Number(minVehicleRowsRaw);
const smokeAuthLogin = process.env.PRODUCTION_SMOKE_AUTH_LOGIN || "";
const smokeAuthPassword = process.env.PRODUCTION_SMOKE_AUTH_PASSWORD || "";

if (!Number.isFinite(minVehicleRows) || minVehicleRows <= 0) {
  throw new Error("PRODUCTION_SMOKE_MIN_VEHICLE_ROWS must be a positive number");
}

console.log(`site url: ${baseUrl}`);
console.log(`api url: ${apiBaseUrl}`);

async function checkUrl(label, url, validate) {
  const response = await fetch(url, {
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

async function databasePost(label, resource, action, payload = null, validate) {
  const smokeAuthCookie = await getSmokeAuthCookie();
  if (!smokeAuthCookie) {
    console.log(`${label}: SKIPPED (PRODUCTION_SMOKE_AUTH_LOGIN/PASSWORD are not set)`);
    return;
  }

  const response = await fetch(`${apiBaseUrl}/api/database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": baseUrl,
      "Referer": `${baseUrl}/`,
      "X-Dispatcher-Request": "same-origin",
      "User-Agent": "dispatcher-production-smoke/1.0",
      "Cookie": smokeAuthCookie,
    },
    body: JSON.stringify({ resource, action, payload }),
  });

  if (!response.ok) {
    let summary = "";
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const body = await response.json();
        const message = body?.error ?? body?.message ?? "";
        if (typeof message === "string" && message.trim()) {
          summary = `: ${message.trim()}`;
        }
      } catch {
        summary = "";
      }
    }

    throw new Error(`${label} returned HTTP ${response.status}${summary}`);
  }

  const body = await response.json();
  await validate(body?.data ?? body);
  console.log(`${label}: OK`);
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
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": baseUrl,
        "Referer": `${baseUrl}/`,
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

await databasePost("vehicles data", "vehicles", "load", null, async (data) => {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  if (rows.length < minVehicleRows) {
    throw new Error(`vehicles data has only ${rows.length} rows; expected at least ${minVehicleRows}`);
  }
});
