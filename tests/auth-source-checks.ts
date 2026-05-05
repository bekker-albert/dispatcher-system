import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const appPageSource = readFileSync(resolve(root, "app/page.tsx"), "utf8");
const appRootSource = readFileSync(resolve(root, "features/app/AppRoot.tsx"), "utf8");
const appShellSource = readFileSync(resolve(root, "features/app/AppPageShell.tsx"), "utf8");
const databaseRouterSource = readFileSync(resolve(root, "lib/server/database/router.ts"), "utf8");
const authSchemaSource = readFileSync(resolve(root, "lib/server/auth/schema.ts"), "utf8");
const envExampleSource = readFileSync(resolve(root, ".env.example"), "utf8");
const readmeSource = readFileSync(resolve(root, "README.md"), "utf8");
const authSources = readJoinedSources([
  ...collectSourceFiles(resolve(root, "features/auth")),
  ...collectSourceFiles(resolve(root, "features/users")),
  ...collectSourceFiles(resolve(root, "lib/server/auth")),
  ...collectSourceFiles(resolve(root, "app/api/auth")),
  resolve(root, "lib/domain/auth/types.ts"),
]);
const allTrackedSource = readJoinedSources([
  resolve(root, ".env.example"),
  resolve(root, "README.md"),
  ...collectSourceFiles(resolve(root, "app")),
  ...collectSourceFiles(resolve(root, "features")),
  ...collectSourceFiles(resolve(root, "lib")),
  ...collectSourceFiles(resolve(root, "tests")),
]);

assert.match(appPageSource, /getAuthSessionFromCookieValue/);
assert.match(appPageSource, /!authRequired\(\)/);
assert.match(appPageSource, /getAuthDisabledUser\(\)/);
assert.match(appPageSource, /<AppRoot initialAuthUser=\{session\.user\} \/>/);
assert.match(appPageSource, /<LoginScreen \/>/);
assert.match(appRootSource, /AuthProvider initialUser=\{initialAuthUser\}/);
assert.match(appShellSource, /<AuthSessionButton \/>/);
assert.match(databaseRouterSource, /authRequired\(\) && !await getAuthSessionFromRequest\(request\)/);
assert.match(databaseRouterSource, /createDatabaseAuthRequiredResponse/);

assert.match(envExampleSource, /AUTH_REQUIRED=true/);
assert.match(envExampleSource, /AUTH_SESSION_SECRET=/);
assert.match(envExampleSource, /AUTH_INITIAL_LOGIN=albert\.bekker/);
assert.match(envExampleSource, new RegExp(["AUTH_INITIAL_PASSWORD", "="].join("")));
assert.match(readmeSource, /AUTH_INITIAL_PASSWORD/);
assert.match(readmeSource, /AUTH_SESSION_SECRET/);

assert.match(authSources, /httpOnly: true/);
assert.match(authSources, /sameSite: "lax"/);
assert.match(authSources, /AUTH_SESSION_SECRET/);
assert.match(authSources, /AUTH_INITIAL_LOGIN/);
assert.match(authSources, /AUTH_INITIAL_PASSWORD/);
assert.match(authSources, /hashPassword/);
assert.match(authSources, /verifyPassword/);
assert.match(authSources, /pbkdf2/);
assert.match(authSources, /checkAuthLoginRateLimit/);
assert.match(authSources, /recordFailedAuthAttempt/);
assert.match(authSources, /isAuthMutationAllowed/);
assert.match(authSources, /canManageUsers/);
assert.match(authSources, /can_manage_users/);
assert.match(authSources, /createAuthUser/);
assert.match(authSchemaSource, /CREATE TABLE IF NOT EXISTS auth_users/);
assert.match(authSchemaSource, /authRows/);
assert.match(authSchemaSource, /authExecute/);
assert.doesNotMatch(authSources, /localStorage/);
const initialPasswordAssignmentPattern = new RegExp(["AUTH_INITIAL_PASSWORD", "="].join("") + "[^\\r\\n]+");
assert.doesNotMatch(allTrackedSource, initialPasswordAssignmentPattern);
assert.doesNotMatch(allTrackedSource, /password:\s*["'`][^"'`]{8,}["'`]/i);

console.log("Auth source checks passed");

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx|md|example)$/.test(name) ? [fullPath] : [];
  });
}

function readJoinedSources(files: string[]) {
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}
