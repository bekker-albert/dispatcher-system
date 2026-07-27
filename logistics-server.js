"use strict";

const fs = require("fs");
const path = require("path");
const next = require("next");

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();
const socketPath = process.env.SOCKET_PATH || "/var/www/dispatcher/data/nodejs/0.sock";

app.prepare().then(() => {
  const server = require("http").createServer((req, res) => {
    if (req.url === "/health" || req.url === "/health/") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify({ status: "ok", service: "gazel-logistics-web" }));
    }
    const host = String(req.headers.host || "").split(":")[0].toLowerCase();
    if (host === "logistics.aam-dispatch.kz" && (req.url === "/" || req.url === "")) req.url = "/logistics";
    return handle(req, res);
  });

  fs.mkdirSync(path.dirname(socketPath), { recursive: true });
  try { if (fs.existsSync(socketPath)) fs.unlinkSync(socketPath); } catch (error) { console.error(error); process.exit(1); }
  server.listen(socketPath, () => {
    fs.chmodSync(socketPath, 0o666);
    console.log(`Gazel logistics web listening on ${socketPath}`);
  });
}).catch((error) => { console.error(error); process.exit(1); });
