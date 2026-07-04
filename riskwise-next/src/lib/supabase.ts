import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client. The URL + publishable (anon) key are PUBLIC values — safe to
 * ship in the browser bundle; all access is guarded by Row Level Security. To
 * rotate or point at another project, change them here (or set the VITE_ envs).
 */
const SUPABASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL ||
  "https://yqfboyjcasddfvzjmdty.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_33pD-MZpnmlSboPPv9WdIw_vJRH2l14";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
