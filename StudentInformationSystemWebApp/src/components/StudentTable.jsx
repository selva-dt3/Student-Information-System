import React from "react";

/**
 * PUBLIC_INTERFACE
 * StudentTable: Table for listing students with pagination controls and inline actions
 */
export default function StudentTable({ items, page, pageSize, total, onPageChange, onEdit, onDelete }) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return (
    <div className="sis-card" role="region" aria-label="Students table">
      <div className="sis-table-responsive">
        <table className="sis-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Name</th>
              <th style={{ textAlign: "left" }}>Email</th>
              <th>Age</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "16px" }}>
                  No students found.
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td style={{ textAlign: "center" }}>{s.age}</td>
                <td>
                  <div className="sis-table-actions">
                    <button className="btn btn-secondary" onClick={() => onEdit(s.id)} aria-label={`Edit ${s.name}`}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => onDelete(s.id)} aria-label={`Delete ${s.name}`}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sis-pagination" aria-label="Pagination">
        <button className="btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Prev
        </button>
        <span className="sis-page-indicator">Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
