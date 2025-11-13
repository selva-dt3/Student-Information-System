import React from 'react';

/**
 * StudentList displays a table of students and exposes edit/delete actions.
 * Props:
 * - students: array
 * - onEdit: function(student)
 * - onDelete: function(student)
 * - sortBy: string
 * - sortDir: 'asc' | 'desc'
 * - onSortChange: function(columnKey)
 */
export default function StudentList({ students, onEdit, onDelete, sortBy = 'created_at', sortDir = 'desc', onSortChange }) {
  const header = (key, label) => {
    const active = sortBy === key;
    const dir = active ? sortDir : null;
    const arrow = active ? (dir === 'asc' ? '▲' : '▼') : '↕';
    return (
      <button
        type="button"
        className={`th-sort${active ? ' active' : ''}`}
        onClick={() => onSortChange?.(key)}
        aria-label={`Sort by ${label} ${active ? (dir === 'asc' ? 'descending' : 'ascending') : ''}`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <span className="sort-indicator" aria-hidden style={{ marginLeft: 6 }}>{arrow}</span>
      </button>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table" aria-label="students-table">
        <thead>
          <tr>
            <th>{header('first_name', 'First')}</th>
            <th>{header('last_name', 'Last')}</th>
            <th>{header('email', 'Email')}</th>
            <th>{header('date_of_birth', 'Date of Birth')}</th>
            <th>{header('grade_level', 'Grade')}</th>
            <th>{header('created_at', 'Created')}</th>
            <th style={{ width: 180 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty">No students found. Try adjusting filters or add a new student.</td>
            </tr>
          ) : students.map((s) => {
            const displayDob = s.date_of_birth ?? '-';
            const displayGrade = s.grade_level ?? '-';
            return (
              <tr key={s.id}>
                <td>{s.first_name}</td>
                <td>{s.last_name}</td>
                <td>{s.email}</td>
                <td>{displayDob}</td>
                <td>{displayGrade}</td>
                <td>{s.created_at ? new Date(s.created_at).toLocaleString() : '-'}</td>
                <td className="actions-cell">
                  <button className="btn btn-small btn-secondary" onClick={() => onEdit(s)} aria-label={`Edit ${s.first_name} ${s.last_name}`}>Edit</button>
                  <button className="btn btn-small btn-danger" onClick={() => onDelete(s)} aria-label={`Delete ${s.first_name} ${s.last_name}`}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
