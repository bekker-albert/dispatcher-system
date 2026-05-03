const baseUrl = (process.env.PRODUCTION_SMOKE_URL || "https://aam-dispatch.kz").replace(/\/+$/, "");

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

await checkUrl("database status", `${baseUrl}/api/database`, async (response) => {
  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("database status response has unexpected shape");
  }
  if (payload.provider !== "mysql") {
    throw new Error(`database status returned unexpected provider: ${String(payload.provider)}`);
  }
  if (payload.configured !== true) {
    throw new Error("database status reports MySQL is not configured");
  }
});
