const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dataProvider = process.env.NEXT_PUBLIC_DATA_PROVIDER;

export const serverDatabaseConfigured = dataProvider === "mysql" || dataProvider === "server";
export const supabaseBackendConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabaseConfigured = serverDatabaseConfigured || supabaseBackendConfigured;
