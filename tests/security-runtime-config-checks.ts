import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { authRequired } from "../lib/server/auth/config";
import { getSupabaseRuntimeConfig } from "../lib/supabase/config";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const envExampleSource = readFileSync(resolve(root, ".env.example"), "utf8");
const supabaseSchemas = [
  "supabase/app-state-schema.sql",
  "supabase/multi-user-schema.sql",
  "supabase/pto-schema.sql",
].map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");

const mutableProcessEnv = process.env as Record<string, string | undefined>;
const previousNodeEnv = process.env.NODE_ENV;
const previousAuthRequired = process.env.AUTH_REQUIRED;

mutableProcessEnv.NODE_ENV = "production";
process.env.AUTH_REQUIRED = "false";
assert.throws(() => authRequired(), /AUTH_REQUIRED=false is not allowed in production/);

mutableProcessEnv.NODE_ENV = "development";
process.env.AUTH_REQUIRED = "false";
assert.equal(authRequired(), false);

restoreEnv("NODE_ENV", previousNodeEnv);
restoreEnv("AUTH_REQUIRED", previousAuthRequired);

const productionSupabaseConfig = getSupabaseRuntimeConfig({
  NODE_ENV: "production",
  NEXT_PUBLIC_DATA_PROVIDER: "supabase",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
}, undefined);
assert.equal(productionSupabaseConfig.productionSupabaseBlocked, true);
assert.equal(productionSupabaseConfig.supabaseBackendConfigured, false);
assert.equal(productionSupabaseConfig.supabaseConfigured, false);

const explicitProductionSupabaseConfig = getSupabaseRuntimeConfig({
  NODE_ENV: "production",
  NEXT_PUBLIC_DATA_PROVIDER: "supabase",
  NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
}, undefined);
assert.equal(explicitProductionSupabaseConfig.productionSupabaseBlocked, false);
assert.equal(explicitProductionSupabaseConfig.supabaseBackendConfigured, true);

const productionMysqlConfig = getSupabaseRuntimeConfig({
  NODE_ENV: "production",
  NEXT_PUBLIC_DATA_PROVIDER: "mysql",
  DB_NAME: "aam_dispatch",
  DB_USER: "dispatcher_ad",
  DB_PASSWORD: "secret",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
}, undefined);
assert.equal(productionMysqlConfig.serverDatabaseConfigured, true);
assert.equal(productionMysqlConfig.supabaseBackendConfigured, false);
assert.equal(productionMysqlConfig.supabaseConfigured, true);

assert.match(envExampleSource, /NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK=false/);
assert.match(envExampleSource, /AUTH_REQUIRED=false is blocked in production/);
assert.doesNotMatch(supabaseSchemas, /create policy "[^"]* anon write"/i);
assert.doesNotMatch(supabaseSchemas, /for all\s+to anon/i);
assert.match(supabaseSchemas, /to authenticated/i);

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
