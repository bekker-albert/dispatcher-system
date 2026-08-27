type RuntimeEnv = Record<string, string | undefined>;

function isServerDatabaseProductionHost(hostname: string | undefined) {
  return Boolean(hostname && /(^|\.)dispetcher\.kz$/i.test(hostname));
}

function getBrowserHostname() {
  return typeof window === "undefined" ? undefined : window.location.hostname;
}

export function getSupabaseRuntimeConfig(env: RuntimeEnv = process.env, browserHostname = getBrowserHostname()) {
  const dataProvider = env.NEXT_PUBLIC_DATA_PROVIDER;
  const forceSupabase = dataProvider === "supabase";
  const browserProductionHostUsesServerDatabase = Boolean(browserHostname)
    && isServerDatabaseProductionHost(browserHostname)
    && !forceSupabase;
  const serverRuntimeMysqlConfigured = !browserHostname
    && Boolean(env.DB_NAME && env.DB_USER && env.DB_PASSWORD)
    && !forceSupabase;
  const serverDatabaseConfigured = dataProvider === "mysql"
    || dataProvider === "server"
    || browserProductionHostUsesServerDatabase
    || serverRuntimeMysqlConfigured;
  const rawSupabaseConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL
    && (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const productionSupabaseAllowed = env.NEXT_PUBLIC_ALLOW_PRODUCTION_SUPABASE_FALLBACK === "true";
  const productionSupabaseBlocked = env.NODE_ENV === "production"
    && rawSupabaseConfigured
    && !productionSupabaseAllowed;
  const supabaseBackendConfigured = rawSupabaseConfigured && !productionSupabaseBlocked;

  return {
    serverDatabaseConfigured,
    supabaseBackendConfigured,
    supabaseConfigured: serverDatabaseConfigured || supabaseBackendConfigured,
    productionSupabaseBlocked,
  };
}

const runtimeConfig = getSupabaseRuntimeConfig();

export const serverDatabaseConfigured = runtimeConfig.serverDatabaseConfigured;
export const supabaseBackendConfigured = runtimeConfig.supabaseBackendConfigured;
export const supabaseConfigured = runtimeConfig.supabaseConfigured;
export const productionSupabaseBlocked = runtimeConfig.productionSupabaseBlocked;
