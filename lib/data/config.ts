import {
  serverDatabaseConfigured,
  supabaseBackendConfigured,
  supabaseConfigured,
} from "@/lib/supabase/config";

export { serverDatabaseConfigured, supabaseBackendConfigured };

// Public data-layer flag: true means the app can load/save through either MySQL API or fallback Supabase.
export const databaseConfigured = supabaseConfigured;

export type DataProviderKind = "mysql" | "supabase" | "none";

export const dataProviderKind: DataProviderKind = serverDatabaseConfigured
  ? "mysql"
  : supabaseBackendConfigured ? "supabase" : "none";

export const dataProviderLabel = dataProviderKind === "mysql"
  ? "MySQL через сервер сайта"
  : dataProviderKind === "supabase" ? "Supabase fallback" : "Не настроен";
