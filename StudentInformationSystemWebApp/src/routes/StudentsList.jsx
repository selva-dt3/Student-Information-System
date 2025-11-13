import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import ConfirmDialog from "../components/ConfirmDialog";
import StudentTable from "../components/StudentTable";
import useStudents from "../hooks/useStudents";
import useRealtimeStudents from "../hooks/useRealtimeStudents";
import { deleteStudent } from "../services/studentService";

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
  useRealtimeStudents();

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
      // eslint-disable-next-line no-alert
      alert(err?.message || "Unable to delete the record. Please try again.");
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
      {error && <div className="sis-error">Error: {error.message}</div>}

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
