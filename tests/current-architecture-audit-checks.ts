import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const auditPath = resolve(testDir, "../docs/CURRENT_ARCHITECTURE_AUDIT.md");

assert.equal(existsSync(auditPath), true);

const audit = readFileSync(auditPath, "utf8");

assert.match(audit, /app\/page\.tsx/);
assert.match(audit, /AppRoot/);
assert.match(audit, /AppPrimaryContent/);
assert.match(audit, /useAppStateBundle/);
assert.match(audit, /lazyPrimaryContent\.tsx/);
assert.match(audit, /One Next\.js app/);
assert.match(audit, /One shared authorization\/session layer/);
assert.match(audit, /One shared database\/data layer/);
assert.match(audit, /No separate Node\.js app per module/);
assert.match(audit, /No separate database per module/);
assert.match(audit, /No global React state for large tables/);
assert.match(audit, /No client-side full scans/);
assert.match(audit, /No full-table saves/);
assert.match(audit, /server-paginated/);
assert.match(audit, /query-policy tests/);
assert.match(audit, /change history/);
assert.match(audit, /aggregate side effects/);

console.log("Current architecture audit checks passed");
