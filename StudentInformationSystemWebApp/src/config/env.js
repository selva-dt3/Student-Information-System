//
// Centralized environment configuration and validation for the app.
// Reads environment variables exposed by CRA (prefix REACT_APP_).
// Provides friendly errors and safe defaults for optional vars.
//
/* eslint-disable no-console */

// PUBLIC_INTERFACE
export function getEnv() {
  /**
   * PUBLIC_INTERFACE
   * Returns validated environment configuration used across the app.
   *
   * Required:
   * - REACT_APP_SUPABASE_URL: Supabase project URL
   * - REACT_APP_SUPABASE_ANON_KEY: Supabase anonymous key
   *
   * Optional:
   * - REACT_APP_FEATURE_FLAGS: comma-separated flags (e.g., "students,analytics")
   * - REACT_APP_LOG_LEVEL: log level (error|warn|info|debug)
   *
   * Returns an object with:
   * { SUPABASE_URL, SUPABASE_ANON_KEY, FEATURE_FLAGS, LOG_LEVEL }
   */
  const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
  const FEATURE_FLAGS = (process.env.REACT_APP_FEATURE_FLAGS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const LOG_LEVEL = process.env.REACT_APP_LOG_LEVEL || "info";

  const missing = [];
  if (!SUPABASE_URL) missing.push("REACT_APP_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("REACT_APP_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    // Friendly guidance during development and CI logs
    const guidance = [
      "Missing required environment variables:",
      `- ${missing.join(", ")}`,
      "",
      "Please add them to your .env file (see .env.example) or your deployment environment.",
      "You can create a Supabase project at https://supabase.com/ and copy:",
      "- Project URL -> REACT_APP_SUPABASE_URL",
      "- anon public key -> REACT_APP_SUPABASE_ANON_KEY",
    ].join("\n");
    // eslint-disable-next-line no-console
    console.error(guidance);
  }

  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    FEATURE_FLAGS,
    LOG_LEVEL,
  };
}
