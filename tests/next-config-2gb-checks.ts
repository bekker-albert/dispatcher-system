import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const nextConfigSource = readFileSync(resolve(testDir, "../next.config.ts"), "utf8");
const performanceDoc = readFileSync(resolve(testDir, "../docs/PERFORMANCE_2GB_RAM.md"), "utf8");

assert.match(nextConfigSource, /const twoGbServerMemoryBudgetBytes = 1536 \* 1024 \* 1024;/);
assert.match(nextConfigSource, /cpus: 2,/);
assert.match(nextConfigSource, /memoryBasedWorkersCount: true,/);
assert.match(nextConfigSource, /parallelServerBuildTraces: false,/);
assert.match(nextConfigSource, /turbopackMemoryLimit: twoGbServerMemoryBudgetBytes,/);
assert.match(nextConfigSource, /webpackMemoryOptimizations: true,/);
assert.match(nextConfigSource, /optimizePackageImports: \["lucide-react"\],/);

assert.match(performanceDoc, /2 GB RAM/);
assert.match(performanceDoc, /Next build worker budget/);
assert.match(performanceDoc, /experimental\.cpus=2/);
assert.match(performanceDoc, /memoryBasedWorkersCount/);
assert.match(performanceDoc, /parallelServerBuildTraces=false/);
assert.match(performanceDoc, /turbopackMemoryLimit/);
assert.match(performanceDoc, /webpackMemoryOptimizations/);

console.log("Next 2 GB config checks passed");
