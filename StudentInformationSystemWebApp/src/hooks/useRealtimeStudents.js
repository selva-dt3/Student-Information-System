import { useEffect } from "react";
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
  const flags = getFeatureFlags();
  const isRealtimeEnabled = flags.has("realtime") && !!enabled;

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
          // payload.new contains the inserted row
          if (typeof onInsert === "function") {
            onInsert(payload.new);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students" },
        (payload) => {
          // payload.new contains updated row
          if (typeof onUpdate === "function") {
            onUpdate(payload.new);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "students" },
        (payload) => {
          // payload.old contains deleted row
          if (typeof onDelete === "function") {
            onDelete(payload.old);
          }
        }
      )
      .subscribe((status) => {
        // Optional: minimal non-PII diagnostic
        // eslint-disable-next-line no-console
        if (status === "SUBSCRIBED") {
          console.info("[sis] realtime subscribed: public.students");
        }
      });

    // Cleanup: unsubscribe on unmount
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[sis] realtime unsubscribe warning", e?.message || e);
      }
    };
  }, [isRealtimeEnabled, onInsert, onUpdate, onDelete]);
}
