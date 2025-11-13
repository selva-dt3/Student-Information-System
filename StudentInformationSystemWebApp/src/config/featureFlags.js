//
// Feature flags utilities.
// Parses REACT_APP_FEATURE_FLAGS into a normalized set of helpers.
//

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /**
   * PUBLIC_INTERFACE
   * Returns parsed feature flags from environment variables.
   *
   * - REACT_APP_FEATURE_FLAGS: comma-separated list of flags
   *   Example: "realtime,students"
   *
   * Returns:
   * {
   *   all: string[],         // normalized list of flags
   *   has: (flag) => bool,   // helper to check flag existence
   * }
   */
  const raw = process.env.REACT_APP_FEATURE_FLAGS || "";
  const all = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const set = new Set(all);
  return {
    all,
    has: (flag) => set.has(String(flag || "").toLowerCase()),
  };
}
