import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import ConfirmDialog from "../components/ConfirmDialog";
import StudentTable from "../components/StudentTable";
import useStudents from "../hooks/useStudents";
import useRealtimeStudents from "../hooks/useRealtimeStudents";
import { deleteStudent } from "../services/studentService";
import { mapSupabaseErrorToMessage, logMinimalError } from "../services/errorMapping";
import { getFeatureFlags } from "../config/featureFlags";

/**
 * Students list page with search, pagination, and delete confirmation.
 * Renders a table of students and provides inline edit/delete actions.
 */
export default function StudentsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const { items, total, loading, error, refetch } = useStudents({ page, pageSize, search });

  // Determine realtime flag once per mount
  const flags = useMemo(() => getFeatureFlags(), []);
  const realtimeEnabled = flags.has("realtime");

  // Helper: local optimistic update for current page's items; rely on refetch to reconcile counts/pagination
  const safeMergeInsert = async (row) => {
    try {
      // If the new row would not be visible due to pagination or filters, we still refetch
      await refetch();
      setPage(1); // make it visible and reset paging
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[sis] realtime insert refetch warning", e?.message || e);
    }
  };

  const safeMergeUpdate = async (row) => {
    try {
      // When a record updates, maintain current page and refresh
      await refetch();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[sis] realtime update refetch warning", e?.message || e);
    }
  };

  const safeMergeDelete = async (row) => {
    try {
      await refetch();
      setPage(1); // deletion can affect counts; normalize view
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[sis] realtime delete refetch warning", e?.message || e);
    }
  };

  // Subscribe to realtime events to keep list consistent without manual refresh.
  // Gated by REACT_APP_FEATURE_FLAGS via getFeatureFlags in the hook.
  useRealtimeStudents({
    enabled: realtimeEnabled,
    onInsert: safeMergeInsert,
    onUpdate: safeMergeUpdate,
    onDelete: safeMergeDelete,
  });

  const handleEdit = (id) => navigate(`/students/${id}/edit`);
  const handleDeleteAsk = (id) => setConfirmId(id);
  const handleConfirmClose = () => setConfirmId(null);

  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteStudent(confirmId);
      setConfirmId(null);
      await refetch();
      // Reset to first page to keep UX stable when last item of page removed
      setPage(1);
    } catch (err) {
      // Map error to friendly message and log minimally
      const friendly = mapSupabaseErrorToMessage(err, { action: "deletion" });
      logMinimalError("StudentsList.delete", err);
      // eslint-disable-next-line no-alert
      alert(friendly);
      setConfirmId(null);
    }
  };

  return (
    <div className="sis-container">
      <div className="sis-header">
        <h2 className="sis-title">Students</h2>
        <div className="sis-header-actions">
          <SearchBar value={search} onChange={setSearch} />
          <button className="btn btn-primary" onClick={() => navigate("/students/new")}>
            + New Student
          </button>
        </div>
      </div>

      {loading && <div className="sis-info">Loading...</div>}
      {error && (
        <>
          {(() => {
            // minimal log for diagnostics
            try { /* eslint-disable no-unused-expressions */
              // keep noise minimal
            } catch (e) { /* noop */ }
            return null;
          })()}
          <div className="sis-error">Error: {error.message}</div>
        </>
      )}

      <StudentTable
        items={items}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDeleteAsk}
      />

      <ConfirmDialog
        open={!!confirmId}
        title="Confirm delete"
        message="Are you sure you want to delete this student? This action cannot be undone."
        onCancel={handleConfirmClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
