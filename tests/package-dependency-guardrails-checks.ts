import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const performanceDoc = readFileSync(resolve(root, "docs", "PERFORMANCE_2GB_RAM.md"), "utf8");

const dependencyGroups = {
  dependencies: packageJson.dependencies ?? {},
  devDependencies: packageJson.devDependencies ?? {},
  optionalDependencies: packageJson.optionalDependencies ?? {},
  peerDependencies: packageJson.peerDependencies ?? {},
} as const;

const forbiddenDependencyNames = new Set([
  "@hapi/hapi",
  "@nestjs/common",
  "@nestjs/core",
  "@prisma/client",
  "@remix-run/node",
  "@remix-run/react",
  "agenda",
  "apollo-server",
  "astro",
  "bee-queue",
  "bull",
  "bullmq",
  "concurrently",
  "drizzle-kit",
  "express",
  "fastify",
  "forever",
  "graphql-yoga",
  "koa",
  "lerna",
  "mongoose",
  "next-compose-plugins",
  "node-cron",
  "nodemon",
  "nx",
  "pm2",
  "prisma",
  "sequelize",
  "typeorm",
  "vite",
  "webpack",
  "workerpool",
]);

const forbiddenDependencyPrefixes = [
  "@nestjs/",
  "@remix-run/",
  "@nx/",
] as const;

const violations = Object.entries(dependencyGroups).flatMap(([groupName, dependencies]) => (
  Object.keys(dependencies).flatMap((dependencyName) => {
    const forbidden = forbiddenDependencyNames.has(dependencyName)
      || forbiddenDependencyPrefixes.some((prefix) => dependencyName.startsWith(prefix));
    return forbidden
      ? [{ groupName, dependencyName }]
      : [];
  })
));

assert.deepEqual(
  violations,
  [],
  "Do not add separate backend frameworks, heavy ORM runtimes, queue/worker runtimes, or multi-app tooling to this 2 GB RAM modular monolith.",
);

assert.ok(packageJson.dependencies?.next, "Next.js must remain the single app runtime.");
assert.ok(packageJson.dependencies?.react, "React must remain the UI runtime.");
assert.ok(packageJson.dependencies?.["react-dom"], "React DOM must remain the UI runtime.");
assert.ok(packageJson.dependencies?.mysql2, "mysql2 remains the lightweight database driver for the shared data layer.");
assert.ok(packageJson.dependencies?.["@supabase/supabase-js"], "Supabase compatibility remains in the shared data layer until migration is complete.");
assert.ok(packageJson.dependencies?.["lucide-react"], "lucide-react remains the shared icon library.");

assert.match(performanceDoc, /Dependency budget guardrail/);
assert.match(performanceDoc, /tests\/package-dependency-guardrails-checks\.ts/);
assert.match(performanceDoc, /Do not add Express, Fastify, NestJS, Prisma, TypeORM, Sequelize, BullMQ, Agenda,\s+PM2, Nodemon, Vite, Nx, or Lerna/);
assert.match(performanceDoc, /New dependencies must support the existing single Next\.js process/);

console.log("Package dependency guardrails checks passed");
