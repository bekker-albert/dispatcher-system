export const stage2ReadModelImplementationPath = "lib/server/database/module-live-handlers.ts" as const;

export const invalidStage2WriteHandlerImplementationPath =
  "lib/server/database/handlers/__invalid__/__invalid__.ts" as const;

export const stage2AllowedImplementationPathDescription =
  "lib/server/database/module-live-handlers.ts or lib/server/database/handlers/*" as const;

export function createExpectedWriteHandlerImplementationPath(
  resource: string,
  databaseAction: string,
) {
  if (!isSafeStage2ImplementationPathSegment(resource) || !isSafeStage2ImplementationPathSegment(databaseAction)) {
    return invalidStage2WriteHandlerImplementationPath;
  }

  return `lib/server/database/handlers/${resource.trim()}/${databaseAction.trim()}.ts`;
}

export function normalizeStage2ImplementationPath(implementationPath: string) {
  return implementationPath.trim().replaceAll("\\", "/");
}

export function isAllowedStage2ImplementationPath(implementationPath: string) {
  const normalizedPath = normalizeStage2ImplementationPath(implementationPath);
  if (hasStage2PathTraversal(normalizedPath)) return false;

  return normalizedPath === stage2ReadModelImplementationPath
    || (
      normalizedPath.startsWith("lib/server/database/handlers/")
      && normalizedPath.endsWith(".ts")
    );
}

export function isSafeStage2ImplementationPathSegment(segment: string) {
  return /^[a-z0-9][a-z0-9-]*$/.test(segment.trim());
}

export function hasStage2PathTraversal(implementationPath: string) {
  return implementationPath.split("/").includes("..");
}
