import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  workspaceModuleCatalog,
  type WorkspaceModuleCatalogItem,
} from "../lib/domain/workspaces/moduleCatalog";

type CatalogSourceField = "currentSource" | "contractSource";

type CatalogSourcePathIssue = {
  code:
    | "source_path_absolute"
    | "source_path_url"
    | "source_path_backslash"
    | "source_path_outside_repo"
    | "source_path_missing"
    | "current_source_outside_allowed_roots"
    | "contract_source_outside_domain"
    | "contract_source_not_file"
    | "contract_source_not_typescript"
    | "source_path_runtime_config";
  moduleId: string;
  field: CatalogSourceField;
  sourcePath: string;
};

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "..");
const runtimeConfigNames = new Set([
  "package.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "Dockerfile",
  "docker-compose.yml",
  ".env",
]);

function validateModuleCatalogSourcePaths(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const issues: CatalogSourcePathIssue[] = [];

  for (const catalogItem of modules) {
    for (const field of ["currentSource", "contractSource"] as const) {
      const sourcePath = catalogItem[field];
      if (!sourcePath) continue;

      const normalizedSourcePath = sourcePath.replaceAll("\\", "/");
      const resolvedPath = resolve(repoRoot, normalizedSourcePath);
      const relativeResolvedPath = relative(repoRoot, resolvedPath);

      if (isAbsolute(sourcePath)) {
        issues.push({ code: "source_path_absolute", moduleId: catalogItem.id, field, sourcePath });
      }

      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(sourcePath)) {
        issues.push({ code: "source_path_url", moduleId: catalogItem.id, field, sourcePath });
      }

      if (sourcePath.includes("\\")) {
        issues.push({ code: "source_path_backslash", moduleId: catalogItem.id, field, sourcePath });
      }

      if (
        relativeResolvedPath === ".."
        || relativeResolvedPath.startsWith(`..${sep}`)
        || isAbsolute(relativeResolvedPath)
      ) {
        issues.push({ code: "source_path_outside_repo", moduleId: catalogItem.id, field, sourcePath });
      }

      if (runtimeConfigNames.has(normalizedSourcePath.split("/").at(-1) ?? "")) {
        issues.push({ code: "source_path_runtime_config", moduleId: catalogItem.id, field, sourcePath });
      }

      if (
        field === "currentSource"
        && !normalizedSourcePath.startsWith("features/")
        && !normalizedSourcePath.startsWith("lib/domain/")
      ) {
        issues.push({
          code: "current_source_outside_allowed_roots",
          moduleId: catalogItem.id,
          field,
          sourcePath,
        });
      }

      if (field === "contractSource") {
        if (!normalizedSourcePath.startsWith("lib/domain/")) {
          issues.push({ code: "contract_source_outside_domain", moduleId: catalogItem.id, field, sourcePath });
        }

        if (!normalizedSourcePath.endsWith(".ts")) {
          issues.push({ code: "contract_source_not_typescript", moduleId: catalogItem.id, field, sourcePath });
        }
      }

      if (!existsSync(resolvedPath)) {
        issues.push({ code: "source_path_missing", moduleId: catalogItem.id, field, sourcePath });
        continue;
      }

      if (field === "contractSource" && !statSync(resolvedPath).isFile()) {
        issues.push({ code: "contract_source_not_file", moduleId: catalogItem.id, field, sourcePath });
      }
    }
  }

  return issues;
}

assert.deepEqual(validateModuleCatalogSourcePaths(), []);

const catalogBaseModule: WorkspaceModuleCatalogItem = {
  id: "catalog-source-test",
  workspaceId: "taxation",
  title: "Catalog source test",
  status: "planned",
  tableStrategy: "server-paginated",
  editingStrategy: "workflow",
  requiredFilters: ["date"],
  nextStep: "Keep source path rules testable.",
};

assert.deepEqual(validateModuleCatalogSourcePaths([
  {
    ...catalogBaseModule,
    currentSource: "missing/catalog-source",
    contractSource: "features/taxation/service-contracts.tsx",
  },
  {
    ...catalogBaseModule,
    id: "catalog-source-url",
    currentSource: "https://example.com/module.ts",
    contractSource: "/outside/service-contracts.ts",
  },
  {
    ...catalogBaseModule,
    id: "catalog-source-runtime-config",
    currentSource: "package.json",
    contractSource: "lib/domain/taxation",
  },
]).map((issue) => issue.code), [
  "current_source_outside_allowed_roots",
  "source_path_missing",
  "contract_source_outside_domain",
  "contract_source_not_typescript",
  "source_path_missing",
  "source_path_url",
  "current_source_outside_allowed_roots",
  "source_path_missing",
  "source_path_absolute",
  "source_path_outside_repo",
  "contract_source_outside_domain",
  "source_path_missing",
  "source_path_runtime_config",
  "current_source_outside_allowed_roots",
  "contract_source_not_typescript",
  "contract_source_not_file",
]);

console.log("Module catalog source path checks passed");
