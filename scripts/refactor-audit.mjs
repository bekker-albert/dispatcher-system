import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".js", ".jsx", ".cjs"]);
const ignoredDirs = new Set([".git", ".next", "node_modules", "coverage", "dist", "build"]);
const routeHookPattern = /\buse(State|Reducer|Effect|Memo|Callback|Ref|Transition|DeferredValue)\s*\(/;
const directDatabaseImportPattern = /from\s+["']@\/lib\/(server|database|supabase|mysql)\//;

const files = [];
const warnings = [];
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) files.push(fullPath);
  }
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

function isReactComponentFile(relativePath, text) {
  return relativePath.endsWith(".tsx") || /from\s+["']react["']/.test(text);
}

walk(root);

const fileStats = files.map((file) => {
  const text = read(file);
  const relativePath = rel(file);
  const lines = lineCount(text);

  if (relativePath === "app/page.tsx") {
    if (lines > 80) errors.push(`${relativePath}: route entry is ${lines} lines; keep it thin.`);
    if (routeHookPattern.test(text)) errors.push(`${relativePath}: route entry contains React hook logic.`);
  }

  if (relativePath.startsWith("app/") && relativePath.endsWith("page.tsx") && routeHookPattern.test(text)) {
    warnings.push(`${relativePath}: route file owns hook logic; move it to a feature module when touched.`);
  }

  if (relativePath.startsWith("features/") && directDatabaseImportPattern.test(text)) {
    warnings.push(`${relativePath}: feature code imports direct database/server adapter; prefer lib/data provider APIs.`);
  }

  if (isReactComponentFile(relativePath, text) && lines > 420) {
    warnings.push(`${relativePath}: ${lines} lines; split before adding more behavior.`);
  }

  return { relativePath, lines };
});

fileStats.sort((a, b) => b.lines - a.lines);

console.log("Refactor audit");
console.log("==============");
console.log("");

console.log("Largest source files:");
for (const item of fileStats.slice(0, 15)) {
  console.log(`- ${item.relativePath}: ${item.lines} lines`);
}

console.log("");
if (warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
} else {
  console.log("Warnings: none");
}

console.log("");
if (errors.length > 0) {
  console.log("Blocking architecture issues:");
  for (const error of errors) console.log(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Blocking architecture issues: none");
}
