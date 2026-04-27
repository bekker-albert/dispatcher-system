import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".js", ".jsx"]);
const ignoredDirs = new Set([".git", ".next", "node_modules"]);
const hardErrors = [];
const warnings = [];
const mojibakePatterns = [
  new RegExp("\\u0420[\\u0402-\\u040f\\u201a-\\u203a\\u20ac]", "u"),
  new RegExp("\\u0421[\\u0402-\\u040f\\u201a-\\u203a\\u20ac]", "u"),
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

const pageFile = path.join(root, "app", "page.tsx");
if (fs.existsSync(pageFile)) {
  const pageText = fs.readFileSync(pageFile, "utf8");
  const pageLines = lineCount(pageText);
  if (pageLines > 120) {
    hardErrors.push(`app/page.tsx is too large (${pageLines} lines). Keep it as a thin route entry.`);
  }
  if (/\buse(State|Memo|Effect|Callback|Ref)\s*\(/.test(pageText)) {
    hardErrors.push("app/page.tsx contains React state/effect logic. Move page logic into features/app.");
  }
}

for (const file of walk(root)) {
  const rel = relative(file);
  const text = fs.readFileSync(file, "utf8");
  const lines = lineCount(text);

  if (/\?{4,}/.test(text)) {
    hardErrors.push(`${rel} contains repeated question marks, likely broken encoding.`);
  }

  if (mojibakePatterns.some((pattern) => pattern.test(text))) {
    hardErrors.push(`${rel} contains mojibake markers, likely broken Russian text encoding.`);
  }

  if (lines > 450 && !rel.startsWith("scripts/")) {
    warnings.push(`${rel} is ${lines} lines. Split when touching this area.`);
  }
}

if (warnings.length > 0) {
  console.log("Project health warnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (hardErrors.length > 0) {
  console.error("Project health failed:");
  for (const error of hardErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Project health check passed.");
