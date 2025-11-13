import { useEffect } from "react";
import { getEnv } from "../config/env";

/**
 * PUBLIC_INTERFACE
 * useRealtimeStudents: Placeholder hook for realtime subscriptions.
 * If REACT_APP_FEATURE_FLAGS includes "realtime", this can be extended to subscribe to Supabase changes.
 */
export default function useRealtimeStudents(enabledFlag = false) {
  const { FEATURE_FLAGS } = getEnv();
  const enabled = FEATURE_FLAGS.includes("realtime") && enabledFlag;

  useEffect(() => {
    if (!enabled) return undefined;
    // Future: set up Supabase channel subscription for "students" changes.
    // Return cleanup to unsubscribe.
    return () => {};
  }, [enabled]);
}
