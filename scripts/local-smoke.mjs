const baseUrl = (process.env.LOCAL_SMOKE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const timeoutMsRaw = process.env.LOCAL_SMOKE_TIMEOUT_MS || "30000";
const timeoutMs = Number(timeoutMsRaw);
const origin = new URL(baseUrl).origin;

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error("LOCAL_SMOKE_TIMEOUT_MS must be a positive number");
}

function assertSmoke(condition, message) {
  if (!condition) throw new Error(message);
}

async function smokeFetch(url, init = {}) {
  return await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function checkHomeHealth() {
  const response = await smokeFetch(baseUrl, {
    method: "HEAD",
    headers: {
      "User-Agent": "dispatcher-local-smoke/1.0",
    },
  });

  assertSmoke(response.ok, `home health returned HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  assertSmoke(contentType.includes("text/html"), "home health response is not HTML");

  console.log("home health: OK");
}

async function checkHome() {
  const response = await smokeFetch(baseUrl, {
    headers: {
      "User-Agent": "dispatcher-local-smoke/1.0",
    },
  });

  assertSmoke(response.ok, `home returned HTTP ${response.status}`);

  const contentType = response.headers.get("content-type") || "";
  assertSmoke(contentType.includes("text/html"), "home response is not HTML");

  const html = await response.text();
  assertSmoke(html.includes('lang="ru"'), "home HTML does not declare the Russian app shell");
  assertSmoke(html.includes("<title>") && html.includes("</title>"), "home HTML does not contain a page title");
  assertSmoke(
    !html.includes("Application error") && !html.includes("Internal Server Error"),
    "home HTML contains an application error marker",
  );

  console.log("home: OK");
}

async function checkPlannedModuleAction() {
  const response = await smokeFetch(`${baseUrl}/api/database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": origin,
      "Referer": `${origin}/`,
      "X-Dispatcher-Request": "same-origin",
      "User-Agent": "dispatcher-local-smoke/1.0",
    },
    body: JSON.stringify({
      resource: "taxation",
      action: "list-waybills",
      payload: {
        scope: { sectionId: "baktai" },
      },
    }),
  });

  assertSmoke(
    response.status === 501,
    `planned taxation/list-waybills returned HTTP ${response.status}; expected 501`,
  );

  const payload = await response.json();
  assertSmoke(payload.code === "planned_module_database_action", "planned API response has unexpected code");
  assertSmoke(payload.endpoint === "/api/database", "planned API response must use the shared database route");
  assertSmoke(payload.routeKind === "single-database-router", "planned API response must stay on one router");
  assertSmoke(payload.liveHandler?.status === "planned-only", "planned API response must not be live");
  assertSmoke(payload.readQuery?.serverPaginated === true, "planned list action must require server pagination");
  assertSmoke(payload.readQuery?.noClientFullScan === true, "planned list action must forbid client full scans");
  assertSmoke(payload.readQuery?.maxPageSize <= 100, "planned list action max page size must stay bounded");

  console.log("planned module action: OK");
}

async function run() {
  console.log(`local smoke url: ${baseUrl}`);
  await checkHomeHealth();
  await checkHome();
  await checkPlannedModuleAction();
  console.log("local smoke passed");
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Local smoke failed: ${message}`);
  console.error("Check that one Next.js dev server is listening on http://127.0.0.1:3000.");
  console.error("Restart with: AUTH_REQUIRED=false npm run dev -- --hostname 127.0.0.1 --port 3000");
  process.exit(1);
});
