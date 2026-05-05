import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const appPageSource = readFileSync(resolve(root, "app/page.tsx"), "utf8");
const appRootSource = readFileSync(resolve(root, "features/app/AppRoot.tsx"), "utf8");
const appHeaderSource = readFileSync(resolve(root, "components/layout/AppHeader.tsx"), "utf8");
const appHeaderStylesSource = readFileSync(resolve(root, "components/layout/AppHeaderStyles.ts"), "utf8");
const authSessionButtonSource = readFileSync(resolve(root, "features/auth/AuthSessionButton.tsx"), "utf8");
const userProfileSource = readFileSync(resolve(root, "features/users/UserProfileSection.tsx"), "utf8");
const userManagementSource = readFileSync(resolve(root, "features/users/UserManagementPanel.tsx"), "utf8");
const authUsersRouteSource = readFileSync(resolve(root, "app/api/auth/users/route.ts"), "utf8");
const navigationTabsSource = readFileSync(resolve(root, "lib/domain/navigation/tabs.ts"), "utf8");
const adminNavigationSource = readFileSync(resolve(root, "lib/domain/admin/navigation.ts"), "utf8");
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
assert.match(appHeaderStylesSource, /zIndex: 200/);
assert.match(appHeaderStylesSource, /alignSelf: "flex-start"/);
assert.match(appHeaderStylesSource, /height: "fit-content"/);
assert.match(appHeaderStylesSource, /justifyContent: "flex-start"/);
assert.doesNotMatch(appHeaderStylesSource, /justifyContent: "space-between"/);
assert.match(appHeaderSource, /onSelectAdminSection\("users"\)/);
assert.match(appHeaderSource, /onSelectTopTab\("admin"\)/);
assert.doesNotMatch(navigationTabsSource, /id: "user", label: "Профиль"/);
assert.match(adminNavigationSource, /value: "users", label: "Профиль"/);
assert.doesNotMatch(authSessionButtonSource, /position:\s*"fixed"/);
assert.match(authSessionButtonSource, /UserCircle/);
assert.match(authSessionButtonSource, /role="dialog"/);
assert.match(authSessionButtonSource, /zIndex: 300/);
assert.match(authSessionButtonSource, /Карточка пользователя/);
assert.match(authSessionButtonSource, /Редактировать профиль/);
assert.match(authSessionButtonSource, /LogOut/);
assert.match(userProfileSource, /Административный профиль/);
assert.match(userProfileSource, /Профиль пользователя/);
assert.match(userProfileSource, /canManageUsers \? <UserManagementPanel \/> : null/);
assert.match(userManagementSource, /Журнал созданных учетных записей/);
assert.match(userManagementSource, /method: "PUT"/);
assert.match(userManagementSource, /Новый пароль/);
assert.match(authUsersRouteSource, /export async function PUT/);
assert.match(authSources, /updateAuthUser/);
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
assert.match(authSources, /verifyPlainPassword/);
assert.match(authSources, /initialAuthUserId/);
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
