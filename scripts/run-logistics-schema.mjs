import { readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const sourceUrl = new URL("./ensure-logistics-schema.mjs", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const directory = path.dirname(sourcePath);
const temporaryPath = path.join(
  directory,
  `.ensure-logistics-schema-runtime-${process.pid}-${Date.now()}.mjs`,
);

const originalSource = await readFile(sourcePath, "utf8");
const incompatibleImport = 'import { loadEnvConfig } from "@next/env";';

if (!originalSource.includes(incompatibleImport)) {
  throw new Error("Logistics schema bootstrap import marker was not found");
}

const compatibleSource = originalSource.replace(
  incompatibleImport,
  'import nextEnv from "@next/env";\nconst { loadEnvConfig } = nextEnv;',
);

await writeFile(temporaryPath, compatibleSource, { encoding: "utf8", mode: 0o600 });

try {
  await import(pathToFileURL(temporaryPath).href);
} finally {
  await unlink(temporaryPath).catch(() => undefined);
}
