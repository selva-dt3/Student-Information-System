//
//
// Maps Supabase/Postgres errors to user-friendly messages.
// Avoids exposing raw database details to end users.
//
//
// PUBLIC_INTERFACE
export function mapSupabaseErrorToMessage(error, { action = "operation" } = {}) {
  /**
   * Translate Supabase error into a friendly string.
   * Known cases:
   * - Postgres unique_violation: code 23505
   * - Permission denied (RLS): code 42501
   * - Missing column / relation errors
   * - Network or unknown: generic fallback
   */
  const code = error?.code || error?.status?.toString?.() || "";
  const rawMsg = String(error?.message || "");
  const msg = rawMsg.toLowerCase();

  // Unique violation hints (email uniqueness commonly)
  if (code === "23505" || msg.includes("duplicate key") || msg.includes("unique")) {
    return "This value must be unique. Please use a different one.";
  }

  // Permission denied (often RLS)
  if (code === "42501" || msg.includes("permission")) {
    return "You do not have permission to perform this action.";
  }

  // Not null violation
  if (code === "23502") {
    return "Required data is missing. Please review your input.";
  }

  // Missing relation/table or column errors
  if (msg.includes("relation") && msg.includes("does not exist")) {
    return "Backend table is missing. Please ensure the 'public.students' table exists.";
  }
  if (msg.includes("column") && msg.includes("does not exist")) {
    return "Backend schema mismatch. Please ensure required columns exist in 'public.students'.";
  }

  // Connection or network issues
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("connection")) {
    return "A network error occurred. Please check your connection and try again.";
  }

  // Default fallback with generic action
  return `Unable to complete the ${action}. Please try again.`;
}

/**
 * Minimal, non-PII logging helper based on REACT_APP_LOG_LEVEL.
 */
function getLogLevelRank() {
  const level = (process.env.REACT_APP_LOG_LEVEL || "info").toLowerCase();
  const map = { error: 0, warn: 1, info: 2, debug: 3 };
  return map[level] ?? 2;
}

// PUBLIC_INTERFACE
export function logMinimalError(context, error) {
  /** Log a minimal, non-PII error for diagnostics. */
  const rank = getLogLevelRank();
  if (rank >= 1) {
    // eslint-disable-next-line no-console
    console.warn("[sis]", context, { code: error?.code, status: error?.status, hint: error?.hint });
  }
}
