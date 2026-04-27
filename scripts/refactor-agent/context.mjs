import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const maxFileChars = 14000;
const maxDiffChars = 28000;
const maxTotalContextChars = 90000;
const maxSourceScanBytes = 600000;
const usageLimit = 80;

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".css"]);
const ignoredDirs = new Set([".git", ".next", "node_modules", "coverage", "dist", "build", "tmp"]);
const ignoredFiles = new Set(["package-lock.json", "tsconfig.tsbuildinfo"]);
const secretFilePattern = /(^|\/)\.env(\.|$)|\.pem$|\.key$/i;

export function buildProjectContext({ root, task, mode, target, includeUsages, includeDiff }) {
  const sections = [];
  const targetInfo = resolveTarget(root, target);

  sections.push(`# Task\n${task}`);
  sections.push(`# Mode\n${mode}`);
  sections.push(commandSection(root, "Git status", "git", ["status", "--short", "--branch"]));
  sections.push(commandSection(root, "Refactor audit", "node", ["scripts/refactor-audit.mjs"]));
  sections.push(commandSection(root, "Project health", "node", ["scripts/check-project-health.mjs"]));
  sections.push(commandSection(root, "Git diff stat", "git", ["diff", "--stat"]));

  if (includeDiff) {
    sections.push(diffSection(root, targetInfo?.relativePath));
    sections.push(untrackedFilesSection(root, targetInfo?.relativePath));
  }

  for (const file of priorityFiles()) {
    const absolute = path.join(root, file);
    if (fs.existsSync(absolute)) sections.push(fileSection(file, absolute));
  }

  if (target) {
    if (!targetInfo) {
      sections.push(`# Target\nTarget was not included because it is missing, outside the repository, ignored, or unsafe: ${target}`);
    } else {
      sections.push(fileSection(`Target: ${targetInfo.relativePath}`, targetInfo.absolutePath));
      if (includeUsages) sections.push(usageSection(root, targetInfo.relativePath));
    }
  }

  const largest = largestSourceFiles(root, 12);
  sections.push(`# Largest Source Files\n${largest.map((item) => `- ${item.relativePath}: ${item.lines} lines`).join("\n")}`);

  const combined = sections.join("\n\n");
  if (combined.length <= maxTotalContextChars) return combined;
  return `${combined.slice(0, maxTotalContextChars)}\n\n[context truncated by refactor-ai-agent]`;
}

function priorityFiles() {
  return [
    "AGENTS.md",
    "ARCHITECTURE.md",
    "CODE_REVIEW.md",
    "package.json",
    "app/page.tsx",
    "features/app/AppRoot.tsx",
  ];
}

function commandSection(root, title, command, commandArgs) {
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

function diffSection(root, targetRelativePath) {
  const argsForDiff = ["diff", "--"];
  if (targetRelativePath) argsForDiff.push(targetRelativePath);

  try {
    const output = execFileSync("git", argsForDiff, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    });
    const clipped = clipText(output.trim() || "(empty)", maxDiffChars, "diff truncated by refactor-ai-agent");
    return `# Git diff${targetRelativePath ? `: ${targetRelativePath}` : ""}\n\`\`\`diff\n${clipped}\n\`\`\``;
  } catch (error) {
    const output = [error.stdout, error.stderr, error.message].filter(Boolean).join("\n").trim();
    return `# Git diff\n\`\`\`text\n${output || "command failed"}\n\`\`\``;
  }
}

function untrackedFilesSection(root, targetRelativePath) {
  const files = sortUntrackedFiles(untrackedSourceFiles(root), targetRelativePath);
  if (files.length === 0) {
    return "# Untracked Source Files\n(empty)";
  }

  const sections = [`# Untracked Source Files\n${files.map((file) => `- ${file.relativePath}`).join("\n")}`];
  for (const file of files.slice(0, 8)) {
    sections.push(fileSection(`Untracked: ${file.relativePath}`, file.absolutePath));
  }

  if (files.length > 8) {
    sections.push(`[${files.length - 8} untracked source files omitted]`);
  }

  return sections.join("\n\n");
}

function sortUntrackedFiles(files, targetRelativePath) {
  if (!targetRelativePath) return files;
  return [...files].sort((a, b) => {
    if (a.relativePath === targetRelativePath) return -1;
    if (b.relativePath === targetRelativePath) return 1;
    return a.relativePath.localeCompare(b.relativePath);
  });
}

function untrackedSourceFiles(root) {
  try {
    const output = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    });

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((relativePath) => isSafeContextFile(relativePath, path.basename(relativePath)))
      .map((relativePath) => ({ relativePath, absolutePath: path.join(root, relativePath) }));
  } catch {
    return [];
  }
}

function fileSection(label, absolute) {
  const text = fs.readFileSync(absolute, "utf8");
  const clipped = clipText(text, maxFileChars, "file truncated by refactor-ai-agent");
  return `# ${label}\n\`\`\`${fileFence(label)}\n${clipped}\n\`\`\``;
}

function usageSection(root, targetRelativePath) {
  const usages = collectUsages(root, targetRelativePath);
  if (usages.length === 0) {
    return `# Target Usages\nNo obvious import/reference lines found for ${targetRelativePath}.`;
  }

  return [
    "# Target Usages",
    `Limited to ${usageLimit} matches for ${targetRelativePath}.`,
    "",
    "```text",
    usages.slice(0, usageLimit).join("\n"),
    "```",
  ].join("\n");
}

function collectUsages(root, targetRelativePath) {
  const withoutExtension = targetRelativePath.replace(/\.[^.]+$/, "");
  const aliasImport = `@/${withoutExtension}`;
  const matches = [];

  for (const file of listSourceFiles(root)) {
    if (file.relativePath === targetRelativePath) continue;

    const importNeedles = buildImportNeedles(file.relativePath, withoutExtension, aliasImport);
    const text = fs.readFileSync(file.absolutePath, "utf8");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!isModuleReferenceLine(line)) continue;
      if (!importNeedles.some((needle) => line.includes(needle))) continue;
      matches.push(`${file.relativePath}:${index + 1}: ${line.trim()}`);
      if (matches.length >= usageLimit) return matches;
    }
  }

  return matches;
}

function buildImportNeedles(fromRelativePath, targetWithoutExtension, aliasImport) {
  const fromDir = path.posix.dirname(fromRelativePath);
  let relativeImport = path.posix.relative(fromDir, targetWithoutExtension);
  if (!relativeImport.startsWith(".")) relativeImport = `./${relativeImport}`;

  return [aliasImport, targetWithoutExtension, relativeImport];
}

function isModuleReferenceLine(line) {
  return /\b(import|export)\b/.test(line) || line.includes("require(") || line.includes("import(");
}

function fileFence(file) {
  const ext = path.extname(file);
  if (ext === ".tsx" || ext === ".ts") return "ts";
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return "js";
  if (ext === ".json") return "json";
  if (ext === ".md") return "md";
  if (ext === ".css") return "css";
  return "text";
}

function largestSourceFiles(root, limit) {
  return listSourceFiles(root)
    .map((file) => ({
      relativePath: file.relativePath,
      lines: fs.readFileSync(file.absolutePath, "utf8").split(/\r?\n/).length,
    }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, limit);
}

function listSourceFiles(root) {
  const result = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignoredDirs.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const relativePath = relative(root, fullPath);
      if (!isSafeContextFile(relativePath, entry.name)) continue;
      if (fs.statSync(fullPath).size > maxSourceScanBytes) continue;
      result.push({ relativePath, absolutePath: fullPath });
    }
  }

  walk(root);
  return result;
}

function resolveTarget(root, target) {
  if (!target) return null;

  const normalizedTarget = target.replaceAll("\\", "/").replace(/^["']|["']$/g, "");
  const absolutePath = path.resolve(root, normalizedTarget);
  const targetRelative = path.relative(root, absolutePath);

  if (targetRelative.startsWith("..") || path.isAbsolute(targetRelative)) return null;
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;

  const relativePath = relative(root, absolutePath);
  if (!isSafeContextFile(relativePath, path.basename(relativePath))) return null;

  return { relativePath, absolutePath };
}

function isSafeContextFile(relativePath, fileName) {
  if (!sourceExtensions.has(path.extname(fileName))) return false;
  if (ignoredFiles.has(fileName)) return false;
  if (secretFilePattern.test(relativePath)) return false;
  return true;
}

function clipText(text, limit, reason) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n[${reason}]`;
}

function relative(root, file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}
