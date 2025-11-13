import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization using environment variables.
 * Required env vars:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY
 *
 * These should be provided by the environment (.env) and must not be hardcoded.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Basic runtime checks to help developers; does not break build.
if (!supabaseUrl || !supabaseAnonKey) {
  // Intentionally not throwing - allow app shell to render with helpful UI messaging.
  // eslint-disable-next-line no-console
  console.warn(
    '[SIS] Missing Supabase configuration. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment.'
  );
}

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a configured Supabase client instance. */
  return createClient(supabaseUrl || '', supabaseAnonKey || '');
}
