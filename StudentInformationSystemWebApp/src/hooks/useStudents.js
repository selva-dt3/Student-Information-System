import { useCallback, useEffect, useState } from "react";
import { listStudents } from "../services/studentService";

/**
 * PUBLIC_INTERFACE
 * useStudents: Fetch students with pagination and optional search filter (client-side).
 * Returns { items, total, loading, error, refetch }.
 */
export default function useStudents({ page, pageSize, search }) {
  const [state, setState] = useState({ items: [], total: 0, loading: false, error: null });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const offset = (page - 1) * pageSize;
      const { data, count } = await listStudents({ limit: pageSize, offset, orderBy: "created_at", ascending: false });
      const filtered = search
        ? (data || []).filter((d) => {
            const q = search.toLowerCase();
            return (
              String(d.name || "").toLowerCase().includes(q) ||
              String(d.email || "").toLowerCase().includes(q)
            );
          })
        : data || [];
      setState({ items: filtered, total: count || filtered.length, loading: false, error: null });
    } catch (err) {
      setState({ items: [], total: 0, loading: false, error: err });
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchData();
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: e }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
