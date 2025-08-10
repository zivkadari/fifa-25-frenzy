import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Attempt to read Supabase credentials from globals injected by the platform.
// Fallback: allow storing them in localStorage under keys 'SUPABASE_URL' and 'SUPABASE_ANON_KEY'.
const getConfig = () => {
  const w = window as any;
  const url =
    w?.SUPABASE_URL ||
    w?.LOVABLE_SUPABASE_URL ||
    localStorage.getItem("SUPABASE_URL") ||
    "";
  const anonKey =
    w?.SUPABASE_ANON_KEY ||
    w?.LOVABLE_SUPABASE_ANON_KEY ||
    localStorage.getItem("SUPABASE_ANON_KEY") ||
    "";
  return { url, anonKey };
};

let client: SupabaseClient | null = null;
const { url, anonKey } = getConfig();
if (url && anonKey) {
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 5 } },
  });
}

export const supabase = client;
export const isSupabaseEnabled = () => Boolean(client);

// Helpers to allow setting/updating credentials at runtime (optional UI could call these)
export const setSupabaseCredentials = (url: string, anonKey: string) => {
  localStorage.setItem("SUPABASE_URL", url);
  localStorage.setItem("SUPABASE_ANON_KEY", anonKey);
  window.location.reload();
};
