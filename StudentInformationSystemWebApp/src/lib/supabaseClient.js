import { createClient } from "@supabase/supabase-js";
import { getEnv } from "../config/env";

// Initialize Supabase singleton client.
// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /**
   * PUBLIC_INTERFACE
   * Returns a singleton Supabase client instance configured with environment variables.
   * Throws a descriptive error if required configuration is missing.
   */
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Throwing here prevents silent failures later
    throw new Error(
      "Supabase configuration missing. Ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set."
    );
  }

  // To avoid creating multiple instances in environments with HMR, memoize on window
  const globalKey = "__SIS_SUPABASE_CLIENT__";
  if (typeof window !== "undefined") {
    if (!window[globalKey]) {
      window[globalKey] = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
    return window[globalKey];
  }

  // Fallback for non-browser (tests)
  if (!getSupabaseClient._nodeClient) {
    getSupabaseClient._nodeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return getSupabaseClient._nodeClient;
}
