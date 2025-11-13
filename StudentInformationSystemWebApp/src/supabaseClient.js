import { createClient } from '@supabase/supabase-js';

/**
 * Minimal Supabase client initialization.
 *
 * Required env vars (Create React App builds REACT_APP_* at compile-time):
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY (preferred) or REACT_APP_SUPABASE_KEY
 */

// Prefer the explicitly named ANON_KEY, but allow KEY as a fallback.
const RAW_URL = process.env.REACT_APP_SUPABASE_URL;
const RAW_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_KEY;

// Light validation
function validateEnv(url, key) {
  const issues = [];
  if (!url) issues.push('REACT_APP_SUPABASE_URL is missing');
  if (!key) issues.push('Missing anon key: set REACT_APP_SUPABASE_ANON_KEY (preferred) or REACT_APP_SUPABASE_KEY');
  return issues;
}

// Log one-time minimal diagnostics for developers
(function diagnosticsOnce() {
  try {
    // eslint-disable-next-line no-console
    console.info('[SIS] Supabase env diagnostics', {
      url_present: Boolean(RAW_URL),
      anon_key_present: Boolean(RAW_KEY),
      issues: validateEnv(RAW_URL, RAW_KEY),
    });
  } catch {
    // ignore
  }
})();

let cachedClient = null;
let cachedError = null;

function initialize() {
  const issues = validateEnv(RAW_URL, RAW_KEY);
  if (issues.length > 0) {
    cachedError = new Error(`Supabase config error: ${issues.join('; ')}`);
    cachedClient = null;
    return;
  }
  try {
    cachedClient = createClient(RAW_URL, RAW_KEY);
    cachedError = null;
  } catch {
    cachedClient = null;
    cachedError = new Error('Failed to initialize Supabase client');
  }
}

initialize();

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a configured Supabase client instance, or throws if misconfigured. */
  if (cachedError) throw cachedError;
  if (!cachedClient) throw new Error('Supabase client not initialized');
  return cachedClient;
}

// PUBLIC_INTERFACE
export function getSupabaseDiagnostics() {
  /**
   * Minimal diagnostics safe for UI display.
   */
  const issues = validateEnv(RAW_URL, RAW_KEY);
  return { ok: issues.length === 0, issues };
}
