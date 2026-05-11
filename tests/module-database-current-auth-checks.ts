import assert from "node:assert/strict";
import type { AuthUser } from "../lib/domain/auth/types";
import {
  authorizeModuleDatabaseRequestWithCurrentTabs,
  canCurrentAuthUserUseModuleCapability,
  getCurrentTabFallbackForWorkspace,
} from "../lib/server/database/module-authorization";

function createUser(patch: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    login: "dispatcher.user",
    displayName: "Dispatcher User",
    lastName: "User",
    firstName: "Dispatcher",
    middleName: "Test",
    email: "dispatcher@example.test",
    phone: "+70000000000",
    positionTitle: "Dispatcher",
    role: "dispatcher",
    canManageUsers: false,
    tabPermissions: {},
    ...patch,
  };
}

assert.equal(getCurrentTabFallbackForWorkspace("taxation"), "fuel");
assert.equal(getCurrentTabFallbackForWorkspace("smts-gps"), "tb");
assert.equal(getCurrentTabFallbackForWorkspace("common-processes"), "common");

const taxationViewer = createUser({
  tabPermissions: {
    fuel: { view: true, edit: false },
  },
});

const taxationListDecision = authorizeModuleDatabaseRequestWithCurrentTabs(taxationViewer, {
  resource: "taxation",
  action: "list-waybills",
  payload: {
    scope: { sectionId: "baktai" },
  },
});

assert.equal(taxationListDecision.appliesToModuleAction, true);
assert.equal(taxationListDecision.allowed, true);
assert.equal(taxationListDecision.tabId, "fuel");
assert.equal(taxationListDecision.reason, "current_tab_permission_granted");

const taxationPatchDecision = authorizeModuleDatabaseRequestWithCurrentTabs(taxationViewer, {
  resource: "taxation",
  action: "patch-waybill",
  payload: {
    scope: { sectionId: "baktai" },
  },
});

assert.equal(taxationPatchDecision.allowed, false);
assert.equal(taxationPatchDecision.reason, "current_tab_permission_denied");

const taxationFuelImportDecision = authorizeModuleDatabaseRequestWithCurrentTabs(taxationViewer, {
  resource: "taxation",
  action: "stage-fuel-statement-import",
  payload: {
    scope: { sectionId: "baktai" },
  },
});

assert.equal(taxationFuelImportDecision.appliesToModuleAction, true);
assert.equal(taxationFuelImportDecision.allowed, false);
assert.equal(taxationFuelImportDecision.tabId, "fuel");
assert.equal(taxationFuelImportDecision.reason, "current_tab_permission_denied");

const missingSectionDecision = authorizeModuleDatabaseRequestWithCurrentTabs(taxationViewer, {
  resource: "taxation",
  action: "list-waybills",
  payload: {},
});

assert.equal(missingSectionDecision.allowed, false);
assert.equal(missingSectionDecision.reason, "missing_section_scope");

const dispatchChief = createUser({ role: "dispatch-chief" });
const adminDecision = authorizeModuleDatabaseRequestWithCurrentTabs(dispatchChief, {
  resource: "admin",
  action: "admin-access-grant",
  payload: {},
});

assert.equal(adminDecision.allowed, true);
assert.equal(adminDecision.reason, "superuser");

const legacyDecision = authorizeModuleDatabaseRequestWithCurrentTabs(taxationViewer, {
  resource: "pto",
  action: "load",
});
assert.equal(legacyDecision.appliesToModuleAction, false);
assert.equal(legacyDecision.allowed, true);

assert.equal(canCurrentAuthUserUseModuleCapability(taxationViewer, "fuel", "view"), true);
assert.equal(canCurrentAuthUserUseModuleCapability(taxationViewer, "fuel", "export"), true);
assert.equal(canCurrentAuthUserUseModuleCapability(taxationViewer, "fuel", "approve"), false);

console.log("Module database current auth checks passed");
