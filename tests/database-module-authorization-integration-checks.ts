import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AuthUser } from "../lib/domain/auth/types";
import { authorizeDatabaseRequest } from "../lib/server/database/authorization";

const testDir = dirname(fileURLToPath(import.meta.url));
const databaseAuthorizationSource = readFileSync(resolve(testDir, "../lib/server/database/authorization.ts"), "utf8");

assert.match(databaseAuthorizationSource, /authorizeModuleDatabaseRequestWithCurrentTabs/);
assert.match(databaseAuthorizationSource, /moduleDecisionRequirement/);

const authUserBase: AuthUser = {
  id: "test-user",
  login: "test",
  displayName: "Test User",
  lastName: "Test",
  firstName: "User",
  middleName: "",
  email: "",
  phone: "",
  positionTitle: "",
  role: "dispatcher",
  canManageUsers: false,
  tabPermissions: {},
};

function authUserWithPermissions(tabPermissions: AuthUser["tabPermissions"]): AuthUser {
  return { ...authUserBase, tabPermissions };
}

function isAllowedFor(user: AuthUser, resource: string, action: string, payload?: unknown) {
  return authorizeDatabaseRequest(user, { resource, action, payload }).allowed;
}

const taxationViewer = authUserWithPermissions({
  fuel: { view: true, edit: false },
});

assert.equal(
  isAllowedFor(taxationViewer, "taxation", "list-waybills", { scope: { sectionId: "baktai" } }),
  true,
);
assert.equal(
  isAllowedFor(taxationViewer, "taxation", "patch-waybill", { scope: { sectionId: "baktai" } }),
  false,
);
assert.equal(isAllowedFor(taxationViewer, "taxation", "list-waybills", {}), false);
assert.deepEqual(authorizeDatabaseRequest(taxationViewer, {
  resource: "taxation",
  action: "list-waybills",
  payload: { scope: { sectionId: "baktai" } },
}).requirement, {
  level: "view",
  tabIds: ["fuel"],
});

const dispatchChief = { ...authUserBase, role: "dispatch-chief" as const, tabPermissions: {} };
assert.equal(isAllowedFor(dispatchChief, "admin", "admin-access-grant", {}), true);

const legacyUnknownResource = authorizeDatabaseRequest(taxationViewer, {
  resource: "fake",
  action: "load",
});
assert.equal(legacyUnknownResource.allowed, true);
assert.deepEqual(legacyUnknownResource.requirement, { level: "authenticated" });

console.log("Database module authorization integration checks passed");
