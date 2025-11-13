import { useEffect, useRef } from "react";
import { getSupabaseClient } from "../lib/supabaseClient";
import { getFeatureFlags } from "../config/featureFlags";

/**
 * PUBLIC_INTERFACE
 * useRealtimeStudents: Subscribes to realtime changes on public.students and forwards
 * INSERT/UPDATE/DELETE events to provided callbacks. Subscription is gated by the
 * "realtime" feature flag and an optional local enabled flag.
 *
 * Params:
 * - options: {
 *     enabled?: boolean,                 // additional local gate (default true)
 *     onInsert?: (row) => void,          // called with new row after insert
 *     onUpdate?: (row) => void,          // called with updated row after update
 *     onDelete?: (row) => void,          // called with deleted row after delete (old values)
 *   }
 *
 * Cleanup:
 * - Unsubscribes from Supabase channel on unmount or when disabled.
 */
export default function useRealtimeStudents(options = {}) {
  const { enabled = true, onInsert, onUpdate, onDelete } = options;

  // Gate by REACT_APP_FEATURE_FLAGS
  const flags = getFeatureFlags();
  const isRealtimeEnabled = flags.has("realtime") && !!enabled;

  // Keep a ref to current handlers to avoid stale closures if parent re-renders
  const handlersRef = useRef({ onInsert, onUpdate, onDelete });
  handlersRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!isRealtimeEnabled) return undefined;

    const supabase = getSupabaseClient();

    // Create a dedicated channel for students changes
    const channel = supabase
      .channel("realtime-students")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "students" },
        (payload) => {
          const h = handlersRef.current.onInsert;
          if (typeof h === "function") h(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students" },
        (payload) => {
          const h = handlersRef.current.onUpdate;
          if (typeof h === "function") h(payload.new);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "students" },
        (payload) => {
          const h = handlersRef.current.onDelete;
          if (typeof h === "function") h(payload.old);
        }
      )
      .subscribe((status) => {
        // eslint-disable-next-line no-console
        if (status === "SUBSCRIBED") {
          console.info("[sis] realtime subscribed: public.students");
        }
      });

    // Cleanup: unsubscribe on unmount or when flag toggles
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[sis] realtime unsubscribe warning", e?.message || e);
      }
    };
  }, [isRealtimeEnabled]);
}
