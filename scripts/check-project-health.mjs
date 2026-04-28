import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceExtensions = new Set([".ts", ".tsx", ".mjs", ".js", ".jsx"]);
const encodingCheckExtensions = new Set([
  ...sourceExtensions,
  ".cjs",
  ".css",
  ".html",
  ".json",
  ".md",
  ".txt",
]);
const ignoredDirs = new Set([".git", ".next", "node_modules", "tmp", "coverage", "dist", "build", ".cache", ".turbo"]);
const ignoredDirPrefixes = [".chrome-pdf-profile"];
const ignoredFileNames = new Set(["package-lock.json", "tsconfig.tsbuildinfo"]);
const coverageModuleAllowlist = new Set([
  "features/admin/structure/adminStructurePersistence",
  "features/pto/ptoDateTableModel",
]);
const forbiddenFeatureImportRoots = [
  "lib/server",
  "lib/supabase",
  "lib/database",
  "lib/mysql",
  "lib/db",
];
const hardErrors = [];
const warnings = [];
const encodingCorruptionPatterns = [
  {
    label: "known mojibake text for Russian word 'Все'",
    pattern: /(?:\u00d0\u2019\u00d1\u0081\u00d0\u00b5|\u0420\u2019\u0421\u0403\u0420\u00b5)/gu,
  },
  {
    label: "known mojibake text for Russian word 'Итого'",
    pattern: /(?:\u00d0\u0098\u00d1\u0082\u00d0\u00be\u00d0\u00b3\u00d0\u00be|\u0420\u0098\u0421\u201a\u0420\u0455\u0420\u0456\u0420\u0455)/gu,
  },
  {
    label: "known mojibake text for Russian word 'Дата'",
    pattern: /(?:\u00d0\u0094\u00d0\u00b0\u00d1\u0082\u00d0\u00b0|\u0420\u201d\u0420\u00b0\u0421\u201a\u0420\u00b0)/gu,
  },
  {
    label: "known mojibake text for Russian word 'Смена'",
    pattern: /(?:\u00d0\u00a1\u00d0\u00bc\u00d0\u00b5\u00d0\u00bd\u00d0\u00b0|\u0420\u040e\u0420\u0458\u0420\u00b5\u0420\u0405\u0420\u00b0)/gu,
  },
  {
    label: "known mojibake text for Russian word 'Причина'",
    pattern: /(?:\u00d0\u009f\u00d1\u0080\u00d0\u00b8\u00d1\u0087\u00d0\u00b8\u00d0\u00bd\u00d0\u00b0|\u0420\u045f\u0421\u0402\u0420\u0451\u0421\u2021\u0420\u0451\u0420\u0405\u0420\u00b0)/gu,
  },
  {
    label: "known mojibake text for Vse",
    pattern: /\u0420\u2019\u0421\u0403\u0420\u00b5/gu,
  },
  {
    label: "known mojibake text for Itogo",
    pattern: /\u0420\u0098\u0421\u201a\u0420\u0455\u0420\u0456\u0420\u0455/gu,
  },
  {
    label: "Unicode replacement character (U+FFFD)",
    pattern: /\uFFFD/gu,
  },
  {
    label: "replacement-character mojibake text (U+043F U+0457 U+0405)",
    pattern: /\u043F\u0457\u0405/gu,
  },
  {
    label: "Cyrillic mojibake sequence",
    pattern: /(?:\u0420[\u00a0-\u00bf\u0402-\u040f\u0450-\u045f\u2018-\u203a\u20ac]|\u0421[\u00a0-\u00bf\u0402-\u040f\u0450-\u045f\u2018-\u203a\u20ac])/gu,
  },
  {
    label: "Latin-1 mojibake sequence",
    pattern: /[\u00d0\u00d1][\u0080-\u00bf]/gu,
  },
  {
    label: "repeated question marks, likely broken encoding",
    pattern: /\?{4,}/gu,
  },
];
const importPatterns = [
  /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
];
const unfinishedFileNamePattern = /(^|[._-])(wip|draft|scratch|tmp|temp|backup|bak|old|extracted)([._-]|$)/i;
const unfinishedCommentPattern = /(^|\n)\s*(?:\/\/|\/\*|\*)\s*(?:TODO|FIXME|WIP|TEMP|temporary|temporarily|stub|placeholder|mock|fake|dummy|work in progress|extracted but not integrated|not integrated|заглушк|времен)/iu;
const productionSourcePathPattern = /^(app|components|features|lib|shared)\//;
const routeLogicPatterns = [
  {
    label: "local array data",
    pattern: /\b(?:const|let|var)\s+\w+\s*=\s*\[/,
  },
  {
    label: "inline array-of-object data",
    pattern: /\[\s*{/,
  },
  {
    label: "array mapping/rendering logic",
    pattern: /\.(?:map|filter|reduce|flatMap|sort)\s*\(/,
  },
  {
    label: "table markup",
    pattern: /<(?:table|thead|tbody|tfoot|tr|td|th)\b/i,
  },
];

function isIgnoredDirName(name) {
  return ignoredDirs.has(name) || ignoredDirPrefixes.some((prefix) => name.startsWith(prefix));
}

function walk(dir, files = [], extensions = sourceExtensions) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && isIgnoredDirName(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files, extensions);
      continue;
    }

    if (extensions.has(path.extname(entry.name)) && !ignoredFileNames.has(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function withoutExtension(relativePath) {
  return relativePath.replace(/\.[^.]+$/, "");
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function shouldCheckEncodingFile(relativePath) {
  if (/^(app|components|features|lib|shared|scripts|tests|docs|public)\//.test(relativePath)) return true;

  return new Set([
    "AGENTS.md",
    "ARCHITECTURE.md",
    "CLAUDE.md",
    "CODE_REVIEW.md",
    "README.md",
    "eslint.config.mjs",
    "next.config.ts",
    "package.json",
    "postcss.config.mjs",
    "tsconfig.json",
  ]).has(relativePath);
}

function findEncodingCorruptionIssues(text) {
  const issues = [];
  const seen = new Set();

  for (const { label, pattern } of encodingCorruptionPatterns) {
    for (const match of text.matchAll(pattern)) {
      const line = lineNumberAt(text, match.index ?? 0);
      const key = `${line}:${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({ line, label });
    }
  }

  return issues;
}

function collectImportSpecifiers(text) {
  const imports = [];
  for (const pattern of importPatterns) {
    for (const match of text.matchAll(pattern)) {
      imports.push({ specifier: match[1], line: lineNumberAt(text, match.index ?? 0) });
    }
  }
  return imports;
}

function resolveExistingModule(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;

  for (const extension of sourceExtensions) {
    const filePath = `${basePath}${extension}`;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const extension of sourceExtensions) {
      const indexPath = path.join(basePath, `index${extension}`);
      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) return indexPath;
    }
  }

  return null;
}

function targetPathForImport(fromFile, specifier) {
  if (specifier.startsWith("@/")) return specifier.slice(2).replaceAll("\\", "/");
  if (!specifier.startsWith(".")) return null;

  const absoluteTarget = path.resolve(path.dirname(fromFile), specifier);
  const relativeTarget = path.relative(root, absoluteTarget).replaceAll(path.sep, "/");
  return relativeTarget.startsWith("../") ? null : relativeTarget;
}

function resolvedModulePathForImport(fromFile, specifier) {
  const targetPath = targetPathForImport(fromFile, specifier);
  if (!targetPath) return null;

  const existingModule = resolveExistingModule(path.join(root, targetPath));
  return existingModule ? relative(existingModule) : targetPath;
}

function isForbiddenFeatureImportTarget(relativePath) {
  return forbiddenFeatureImportRoots.some((forbiddenRoot) => (
    relativePath === forbiddenRoot || relativePath.startsWith(`${forbiddenRoot}/`)
  ));
}

function hasRuntimeExport(text) {
  return /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|let|var)\b/.test(text);
}

function shouldRequireTestCoverage(relativePath, text) {
  if (!relativePath.startsWith("features/") && !relativePath.startsWith("lib/domain/")) return false;
  if (!relativePath.endsWith(".ts") || relativePath.endsWith(".d.ts")) return false;
  if (!hasRuntimeExport(text)) return false;

  const baseName = path.basename(relativePath, ".ts");
  const lowerBaseName = baseName.toLowerCase();
  if (lowerBaseName === "types" || lowerBaseName.endsWith("types")) return false;
  if (lowerBaseName.startsWith("use") || lowerBaseName.endsWith("viewmodel")) return false;

  return (
    lowerBaseName.endsWith("model")
    || lowerBaseName === "grid"
    || lowerBaseName.endsWith("grid")
    || lowerBaseName.endsWith("persistence")
    || lowerBaseName.includes("persistence-")
  );
}

const sourceFiles = walk(root);
const encodingFiles = walk(root, [], encodingCheckExtensions).filter((file) => shouldCheckEncodingFile(relative(file)));
const testImports = new Set();
for (const file of sourceFiles) {
  const rel = relative(file);
  if (!rel.startsWith("tests/")) continue;

  const text = fs.readFileSync(file, "utf8");
  for (const { specifier } of collectImportSpecifiers(text)) {
    const resolvedPath = resolvedModulePathForImport(file, specifier);
    if (resolvedPath) testImports.add(withoutExtension(resolvedPath));
  }
}

for (const file of encodingFiles) {
  const rel = relative(file);
  const text = fs.readFileSync(file, "utf8");
  for (const issue of findEncodingCorruptionIssues(text)) {
    hardErrors.push(`${rel}:${issue.line} contains ${issue.label}. Restore the intended UTF-8 text before continuing.`);
  }
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
  for (const { label, pattern } of routeLogicPatterns) {
    if (pattern.test(pageText)) {
      hardErrors.push(`app/page.tsx contains ${label}. Keep table/data/product logic in feature modules.`);
    }
  }
}

for (const file of sourceFiles) {
  const rel = relative(file);
  const text = fs.readFileSync(file, "utf8");
  const lines = lineCount(text);
  const modulePath = withoutExtension(rel);

  if (lines > 450 && !rel.startsWith("scripts/")) {
    warnings.push(`${rel} is ${lines} lines. Split when touching this area.`);
  }

  if (productionSourcePathPattern.test(rel) && unfinishedFileNamePattern.test(path.basename(rel))) {
    hardErrors.push(`${rel} looks like an unfinished extracted/WIP source file. Integrate it or remove it.`);
  }

  const unfinishedCommentMatch = text.match(unfinishedCommentPattern);
  if (unfinishedCommentMatch && productionSourcePathPattern.test(rel)) {
    hardErrors.push(`${rel}:${lineNumberAt(text, unfinishedCommentMatch.index ?? 0)} contains an unfinished TODO/WIP/temp placeholder marker.`);
  }

  if (rel.startsWith("features/")) {
    for (const { specifier, line } of collectImportSpecifiers(text)) {
      const targetPath = targetPathForImport(file, specifier);
      if (targetPath && isForbiddenFeatureImportTarget(targetPath)) {
        hardErrors.push(`${rel}:${line} imports direct server/database module "${specifier}". Use lib/data provider APIs instead.`);
      }
    }
  }

  if (
    shouldRequireTestCoverage(rel, text)
    && !coverageModuleAllowlist.has(modulePath)
    && !testImports.has(modulePath)
  ) {
    hardErrors.push(`${rel} is a model/grid/persistence module without direct test coverage. Import it from a tests/*-checks.ts file or add a deliberate guard exception.`);
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
