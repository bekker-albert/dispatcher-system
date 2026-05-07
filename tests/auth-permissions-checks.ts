import assert from "node:assert/strict";

import {
  canAuthUserEditTab,
  canAuthUserViewTab,
  getEffectiveAuthTabAccess,
  isAuthUserSuperuser,
  type AuthUser,
} from "../lib/domain/auth/types";
import { validateRequiredAuthProfile } from "../lib/server/auth/profile-validation";

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

const admin = createUser({ role: "dispatch-chief" });
assert.equal(isAuthUserSuperuser(admin), true);
assert.deepEqual(getEffectiveAuthTabAccess(admin, "fleet"), { view: true, edit: true });

const userWithoutPermissions = createUser();
assert.equal(isAuthUserSuperuser(userWithoutPermissions), false);
assert.deepEqual(getEffectiveAuthTabAccess(userWithoutPermissions, "fleet"), { view: false, edit: false });
assert.equal(canAuthUserViewTab(userWithoutPermissions, "fleet"), false);
assert.equal(canAuthUserEditTab(userWithoutPermissions, "fleet"), false);

const userManager = createUser({ canManageUsers: true });
assert.deepEqual(getEffectiveAuthTabAccess(userManager, "admin"), { view: true, edit: true });
assert.deepEqual(getEffectiveAuthTabAccess(userManager, "fleet"), { view: false, edit: false });

const explicitEditor = createUser({
  tabPermissions: {
    fleet: { view: false, edit: true },
    pto: { view: true, edit: false },
  },
});
assert.equal(canAuthUserViewTab(explicitEditor, "fleet"), true);
assert.equal(canAuthUserEditTab(explicitEditor, "fleet"), true);
assert.equal(canAuthUserViewTab(explicitEditor, "pto"), true);
assert.equal(canAuthUserEditTab(explicitEditor, "pto"), false);

const validProfile = {
  lastName: "Bekker",
  firstName: "Albert",
  middleName: "Test",
  positionTitle: "Chief Dispatcher",
  email: "albert@example.test",
  phone: "+70000000000",
};
assert.doesNotThrow(() => validateRequiredAuthProfile(validProfile));
assert.throws(() => validateRequiredAuthProfile({ ...validProfile, firstName: "" }));
assert.throws(() => validateRequiredAuthProfile({ ...validProfile, lastName: "Bekker1" }));
assert.throws(() => validateRequiredAuthProfile({ ...validProfile, positionTitle: "Chief 2" }));

console.log("Auth permissions checks passed");
