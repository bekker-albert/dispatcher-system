import assert from "node:assert/strict";
import {
  createExpectedWriteHandlerImplementationPath,
  invalidStage2WriteHandlerImplementationPath,
  isAllowedStage2ImplementationPath,
  isSafeStage2ImplementationPathSegment,
  normalizeStage2ImplementationPath,
  stage2AllowedImplementationPathDescription,
  stage2ReadModelImplementationPath,
} from "../lib/domain/workspaces/stage2ImplementationPaths";

assert.equal(stage2ReadModelImplementationPath, "lib/server/database/module-live-handlers.ts");
assert.equal(
  stage2AllowedImplementationPathDescription,
  "lib/server/database/module-live-handlers.ts or lib/server/database/handlers/*",
);

assert.equal(
  normalizeStage2ImplementationPath(" lib\\server\\database\\handlers\\taxation\\create-waybill.ts "),
  "lib/server/database/handlers/taxation/create-waybill.ts",
);

assert.equal(isAllowedStage2ImplementationPath(stage2ReadModelImplementationPath), true);
assert.equal(
  isAllowedStage2ImplementationPath("lib\\server\\database\\handlers\\taxation\\create-waybill.ts"),
  true,
);
assert.equal(isAllowedStage2ImplementationPath("lib/server/database/handlers/taxation"), false);
assert.equal(isAllowedStage2ImplementationPath("lib/server/database/handlers/../module-live-handlers.ts"), false);
assert.equal(isAllowedStage2ImplementationPath("features/app/AppRoot.tsx"), false);

assert.equal(isSafeStage2ImplementationPathSegment("taxation"), true);
assert.equal(isSafeStage2ImplementationPathSegment("create-waybill"), true);
assert.equal(isSafeStage2ImplementationPathSegment(" taxation "), true);
assert.equal(isSafeStage2ImplementationPathSegment("../taxation"), false);
assert.equal(isSafeStage2ImplementationPathSegment("taxation/create-waybill"), false);
assert.equal(isSafeStage2ImplementationPathSegment("Taxation"), false);
assert.equal(isSafeStage2ImplementationPathSegment(""), false);

assert.equal(
  createExpectedWriteHandlerImplementationPath("taxation", "create-waybill"),
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(
  createExpectedWriteHandlerImplementationPath(" taxation ", " create-waybill "),
  "lib/server/database/handlers/taxation/create-waybill.ts",
);
assert.equal(
  createExpectedWriteHandlerImplementationPath("../taxation", "create-waybill"),
  invalidStage2WriteHandlerImplementationPath,
);
assert.equal(
  createExpectedWriteHandlerImplementationPath("taxation", "../create-waybill"),
  invalidStage2WriteHandlerImplementationPath,
);

console.log("Stage 2 implementation path checks passed");
