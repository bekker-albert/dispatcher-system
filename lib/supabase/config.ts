const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dataProvider = process.env.NEXT_PUBLIC_DATA_PROVIDER;
const forceSupabase = dataProvider === "supabase";
const browserProductionHostUsesServerDatabase = typeof window !== "undefined"
  && /(^|\.)aam-dispatch\.kz$/i.test(window.location.hostname)
  && !forceSupabase;
const serverRuntimeMysqlConfigured = typeof window === "undefined"
  && Boolean(process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD)
  && !forceSupabase;

export const serverDatabaseConfigured = dataProvider === "mysql"
  || dataProvider === "server"
  || browserProductionHostUsesServerDatabase
  || serverRuntimeMysqlConfigured;
export const supabaseBackendConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabaseConfigured = serverDatabaseConfigured || supabaseBackendConfigured;
