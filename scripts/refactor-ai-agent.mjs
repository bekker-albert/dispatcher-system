import { execFileSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const root = process.cwd();
const defaultModel = "gpt-5.2";
const outputDir = path.join(root, "tmp");
const outputFile = path.join(outputDir, "refactor-ai-agent-report.md");
const maxFileChars = 14000;
const maxTotalContextChars = 70000;

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md"]);
const ignoredDirs = new Set([".git", ".next", "node_modules", "coverage", "dist", "build", "tmp"]);
const ignoredFiles = new Set(["package-lock.json", "tsconfig.tsbuildinfo"]);
const secretFilePattern = /(^|\/)\.env(\.|$)|\.pem$|\.key$/i;

const args = parseArgs(process.argv.slice(2));
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

if (args.help) {
  printHelp();
  process.exit(0);
}

const task = args.task || "Проведи архитектурный аудит проекта и предложи следующий безопасный рефакторинг.";
const model = args.model || process.env.OPENAI_REFACTOR_MODEL || process.env.OPENAI_MODEL || defaultModel;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey && !args.offline) {
  console.error("OPENAI_API_KEY не найден. Добавь его в .env.local или переменные окружения.");
  console.error("Для локального отчета без ИИ запусти: npm run refactor:ai -- --offline");
  process.exit(1);
}

const context = buildProjectContext(task);

if (args.offline) {
  const report = [
    "# Refactor AI Agent: локальный режим",
    "",
    "ИИ не запускался, потому что выбран режим `--offline`.",
    "",
    context,
  ].join("\n");
  writeReport(report);
  console.log(`Локальный отчет сохранен: ${relative(outputFile)}`);
  process.exit(0);
}

const prompt = [
  "Ты senior/fullstack architect для рабочей диспетчерской системы.",
  "Твоя задача - разгрузить основного разработчика: найти конкретные архитектурные проблемы, дать безопасный план работ и не предлагать хаотичные переписывания.",
  "",
  "Правила:",
  "- Отвечай на русском.",
  "- Не предлагай складывать логику в app/page.tsx.",
  "- Не предлагай менять пользовательские данные, .env, базу или production-сервер без отдельного решения.",
  "- Разделяй блокирующие проблемы, ближайший план и технический долг.",
  "- Если нужны правки, группируй их в маленькие коммиты.",
  "- Для каждого предложения указывай конкретные файлы.",
  "- Не выдумывай состояние проекта сверх предоставленного контекста.",
  "",
  context,
].join("\n");

const apiResult = await createOpenAiResponse(apiKey, {
  model,
  instructions: "You are a rigorous software architecture review agent. Produce a practical, ordered refactoring plan.",
  input: prompt,
  max_output_tokens: Number(process.env.OPENAI_REFACTOR_MAX_OUTPUT_TOKENS || 5000),
  store: false,
});

if (!apiResult.ok) {
  printOpenAiError(apiResult.status, apiResult.body?.error?.message || apiResult.statusText || "unknown error");
  process.exit(1);
}

const outputText = extractOutputText(apiResult.body);
if (!outputText) {
  console.error("OpenAI API не вернул текстовый ответ.");
  process.exit(1);
}

writeReport(outputText);
console.log(`AI refactor report saved: ${relative(outputFile)}`);

function parseArgs(argv) {
  const result = { help: false, offline: false, task: "", model: "" };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--offline") result.offline = true;
    else if (arg === "--task") result.task = argv[++i] || "";
    else if (arg.startsWith("--task=")) result.task = arg.slice("--task=".length);
    else if (arg === "--model") result.model = argv[++i] || "";
    else if (arg.startsWith("--model=")) result.model = arg.slice("--model=".length);
  }

  return result;
}

function printHelp() {
  console.log([
    "AI refactor agent",
    "",
    "Usage:",
    "  npm run refactor:ai -- --task \"Проверить ПТО\"",
    "  npm run refactor:ai -- --offline",
    "  npm run refactor:ai -- --model gpt-5.2 --task \"План рефакторинга отчетности\"",
    "",
    "Environment:",
    "  OPENAI_API_KEY=...",
    "  OPENAI_REFACTOR_MODEL=gpt-5.2",
    "  OPENAI_REFACTOR_MAX_OUTPUT_TOKENS=5000",
  ].join("\n"));
}

function createOpenAiResponse(apiKeyValue, requestBody) {
  const body = JSON.stringify(requestBody);

  return new Promise((resolve) => {
    const request = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/responses",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKeyValue}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const responseText = Buffer.concat(chunks).toString("utf8");
          const parsedBody = parseJsonSafe(responseText);

          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            statusText: response.statusMessage,
            body: parsedBody,
          });
        });
      },
    );

    request.on("error", (error) => {
      resolve({
        ok: false,
        status: 0,
        statusText: error.message,
        body: null,
      });
    });

    request.write(body);
    request.end();
  });
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function printOpenAiError(status, message) {
  if (status === 429) {
    console.error("OpenAI API вернул ошибку 429: лимит или баланс аккаунта исчерпан.");
    console.error("Проверь Billing/Usage в аккаунте OpenAI или используй другой API-ключ с доступной квотой.");
    console.error("Пока квоты нет, можно запускать локальную проверку без ИИ: npm run refactor:ai -- --offline");
    return;
  }

  if (status === 401) {
    console.error("OpenAI API вернул ошибку 401: ключ неверный или не имеет доступа.");
    console.error("Проверь OPENAI_API_KEY в .env.local. Не отправляй ключ в чат.");
    return;
  }

  if (status === 0) {
    console.error(`Не удалось подключиться к OpenAI API: ${message}`);
    return;
  }

  console.error(`OpenAI API вернул ошибку ${status}: ${message}`);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index <= 0) continue;

    const key = trimmed.slice(0, index).trim();
    if (process.env[key] !== undefined) continue;

    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}

function buildProjectContext(taskText) {
  const sections = [];

  sections.push(`# Задача\n${taskText}`);
  sections.push(commandSection("Git status", "git", ["status", "--short", "--branch"]));
  sections.push(commandSection("Git diff stat", "git", ["diff", "--stat"]));
  sections.push(commandSection("Refactor audit", "node", ["scripts/refactor-audit.mjs"]));
  sections.push(commandSection("Project health", "node", ["scripts/check-project-health.mjs"]));

  const priorityFiles = [
    "AGENTS.md",
    "ARCHITECTURE.md",
    "CODE_REVIEW.md",
    "package.json",
    "app/page.tsx",
    "features/app/AppRoot.tsx",
  ];

  for (const file of priorityFiles) {
    const absolute = path.join(root, file);
    if (fs.existsSync(absolute)) sections.push(fileSection(file, absolute));
  }

  const largest = largestSourceFiles(12);
  sections.push(`# Крупные файлы\n${largest.map((item) => `- ${item.relativePath}: ${item.lines} lines`).join("\n")}`);

  let combined = sections.join("\n\n");
  if (combined.length > maxTotalContextChars) {
    combined = `${combined.slice(0, maxTotalContextChars)}\n\n[context truncated by refactor-ai-agent]`;
  }

  return combined;
}

function commandSection(title, command, commandArgs) {
  try {
    const output = execFileSync(command, commandArgs, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    });
    return `# ${title}\n\`\`\`text\n${output.trim() || "(empty)"}\n\`\`\``;
  } catch (error) {
    const output = [error.stdout, error.stderr, error.message].filter(Boolean).join("\n").trim();
    return `# ${title}\n\`\`\`text\n${output || "command failed"}\n\`\`\``;
  }
}

function fileSection(label, absolute) {
  const text = fs.readFileSync(absolute, "utf8");
  const clipped = text.length > maxFileChars ? `${text.slice(0, maxFileChars)}\n\n[file truncated]` : text;
  return `# ${label}\n\`\`\`${fileFence(label)}\n${clipped}\n\`\`\``;
}

function fileFence(file) {
  const ext = path.extname(file);
  if (ext === ".tsx" || ext === ".ts") return "ts";
  if (ext === ".json") return "json";
  if (ext === ".md") return "md";
  return "text";
}

function largestSourceFiles(limit) {
  const result = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignoredDirs.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const relativePath = relative(fullPath);
      if (!sourceExtensions.has(path.extname(entry.name))) continue;
      if (ignoredFiles.has(entry.name)) continue;
      if (secretFilePattern.test(relativePath)) continue;

      const text = fs.readFileSync(fullPath, "utf8");
      result.push({ relativePath, lines: text.split(/\r?\n/).length });
    }
  }

  walk(root);
  return result.sort((a, b) => b.lines - a.lines).slice(0, limit);
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;

  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }

  return parts.join("\n").trim();
}

function writeReport(markdown) {
  fs.mkdirSync(outputDir, { recursive: true });
  const header = [
    `# Refactor AI Agent Report`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
  ].join("\n");
  fs.writeFileSync(outputFile, `${header}${markdown.trim()}\n`, "utf8");
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}
