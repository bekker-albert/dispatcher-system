import { execFileSync } from "node:child_process";

const envPathspec = ".env*";
const allowedTrackedPaths = new Set([".env.example"]);

function gitLines(args) {
  const output = execFileSync("git", args, {
    encoding: "utf8",
  }).trim();

  return output
    ? output
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\\/g, "/"))
      .filter(Boolean)
    : [];
}

function protectedEnvPaths(paths) {
  return paths.filter((path) => {
    const fileName = path.split("/").at(-1) ?? path;
    return fileName.startsWith(".env") && !allowedTrackedPaths.has(fileName);
  });
}

const trackedEnvPaths = protectedEnvPaths(gitLines(["ls-files", "--cached", "--", envPathspec]));
const unignoredEnvPaths = protectedEnvPaths(gitLines(["ls-files", "--others", "--exclude-standard", "--", envPathspec]));

const violations = [];

if (trackedEnvPaths.length > 0) {
  violations.push(`tracked env files: ${trackedEnvPaths.join(", ")}`);
}

if (unignoredEnvPaths.length > 0) {
  violations.push(`unignored env files: ${unignoredEnvPaths.join(", ")}`);
}

if (violations.length > 0) {
  console.error("Env ignore check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Env ignore check passed.");
