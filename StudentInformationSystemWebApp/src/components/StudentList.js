import React from 'react';

/**
 * StudentList displays a table of students and exposes edit/delete actions.
 * Props:
 * - students: array
 * - onEdit: function(student)
 * - onDelete: function(student)
 */
export default function StudentList({ students, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-title-row">
        <h3 className="card-title">Students</h3>
        <span className="muted">{students.length} total</span>
      </div>
      <div className="table-responsive">
        <table className="table" aria-label="students-table">
          <thead>
            <tr>
              <th>First</th>
              <th>Last</th>
              <th>Email</th>
              <th>Age</th>
              <th>Grade</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">No students found. Add one to get started.</td>
              </tr>
            ) : students.map((s) => (
              <tr key={s.id}>
                <td>{s.first_name}</td>
                <td>{s.last_name}</td>
                <td>{s.email}</td>
                <td>{s.age ?? '-'}</td>
                <td>{s.grade ?? '-'}</td>
                <td className="actions-cell">
                  <button className="btn btn-small btn-secondary" onClick={() => onEdit(s)} aria-label={`Edit ${s.first_name} ${s.last_name}`}>Edit</button>
                  <button className="btn btn-small btn-danger" onClick={() => onDelete(s)} aria-label={`Delete ${s.first_name} ${s.last_name}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
