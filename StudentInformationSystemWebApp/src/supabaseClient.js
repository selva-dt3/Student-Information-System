import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization with robust env validation.
 *
 * Required env vars (Create React App builds REACT_APP_* at compile-time):
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_ANON_KEY
 *
 * Never hardcode secrets. This module only logs minimal, non-sensitive diagnostics.
 */

const RAW_URL = process.env.REACT_APP_SUPABASE_URL;
const RAW_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Mask a secret for logging (only show prefix length).
 * Example: abcdef... (len=42)
 */
function maskSecret(v) {
  if (!v) return 'undefined';
  const shown = String(v).slice(0, 6);
  return `${shown}… (len=${String(v).length})`;
}

/**
 * Validate env values without exposing secrets.
 */
function validateEnv(url, key) {
  const issues = [];

  if (!url) {
    issues.push('REACT_APP_SUPABASE_URL is missing');
  } else if (!/^https?:\/\//i.test(url)) {
    issues.push('REACT_APP_SUPABASE_URL does not look like a URL');
  }

  if (!key) {
    issues.push('REACT_APP_SUPABASE_ANON_KEY is missing');
  } else if (String(key).length < 20) {
    // anon keys are typically much longer; this helps catch accidental short values
    issues.push('REACT_APP_SUPABASE_ANON_KEY seems too short');
  }

  return issues;
}

/**
 * Print non-sensitive diagnostics one time to assist developers.
 */
function logDiagnosticsOnce(url, key, issues) {
  if (window.__SIS_SUPABASE_DIAG_LOGGED__) return;
  window.__SIS_SUPABASE_DIAG_LOGGED__ = true;

  // eslint-disable-next-line no-console
  console.info('[SIS] Supabase env diagnostics', {
    url_present: Boolean(url),
    url_preview: url ? (String(url).startsWith('http') ? new URL(url).origin : 'invalid') : 'missing',
    anon_key_present: Boolean(key),
    anon_key_preview: key ? maskSecret(key) : 'missing',
    issues
  });

  if (issues.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[SIS] Missing/invalid Supabase configuration. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env before building.'
    );
  }
}

/**
 * Lazily create and cache the Supabase client after validation.
 */
let cachedClient = null;
let cachedError = null;

/**
 * Create client or record a configuration error for later surfacing.
 */
function initialize() {
  const issues = validateEnv(RAW_URL, RAW_KEY);
  logDiagnosticsOnce(RAW_URL, RAW_KEY, issues);

  if (issues.length > 0) {
    cachedError = new Error(`Supabase config error: ${issues.join('; ')}`);
    cachedClient = null;
    return;
  }

  try {
    cachedClient = createClient(RAW_URL, RAW_KEY);
    cachedError = null;
  } catch (e) {
    cachedClient = null;
    cachedError = new Error('Failed to initialize Supabase client');
    // eslint-disable-next-line no-console
    console.error('[SIS] Supabase initialization error', { message: e?.message });
  }
}

initialize();

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a configured Supabase client instance, or throws if misconfigured. */
  if (cachedError) {
    // Throwing here allows callers to handle and show friendly UI messages without secrets.
    throw cachedError;
  }
  if (!cachedClient) {
    // Should not happen, but guard anyway.
    throw new Error('Supabase client not initialized');
  }
  return cachedClient;
}

// PUBLIC_INTERFACE
export function getSupabaseDiagnostics() {
  /**
   * Returns minimal diagnostics safe for UI display:
   * {
   *   ok: boolean,
   *   issues?: string[]
   * }
   */
  const issues = validateEnv(RAW_URL, RAW_KEY);
  return {
    ok: issues.length === 0,
    issues
  };
}
