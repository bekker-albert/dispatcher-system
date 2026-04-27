import fs from "node:fs";
import path from "node:path";

export function writeReport({ root, outputFile, markdown, mode, target }) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const headerLines = [
    "# Refactor AI Agent Report",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${mode}`,
    target ? `Target: ${target}` : "",
  ].filter(Boolean).join("\n");

  fs.writeFileSync(outputFile, `${headerLines}\n\n${markdown.trim()}\n`, "utf8");
  console.log(`Refactor agent report saved: ${relative(root, outputFile)}`);
}

export function relative(root, file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}
