export {
  serverDatabaseConfigured,
  supabaseBackendConfigured,
} from "@/lib/supabase/config";

// Public data-layer flag: true means the app can load/save through either MySQL API or fallback Supabase.
export { supabaseConfigured as databaseConfigured } from "@/lib/supabase/config";
