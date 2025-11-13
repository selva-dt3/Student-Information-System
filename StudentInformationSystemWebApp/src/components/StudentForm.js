import React, { useEffect, useState } from 'react';
import { validateStudent } from '../services/studentsService';

/**
 * StudentForm component for creating/updating a student.
 * Props:
 * - initial: optional student object to edit
 * - onCancel: function
 * - onSubmit: async function(student) -> Promise
 *
 * Field normalization note:
 * - UI state uses DB-aligned keys:
 *   first_name, last_name, email, date_of_birth, grade_level, address, phone
 * - Any legacy incoming data (dob, grade) is mapped to the normalized keys.
 */
export default function StudentForm({ initial = null, onCancel, onSubmit }) {
  const [values, setValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    date_of_birth: '',
    grade_level: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setValues({
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        email: initial.email || '',
        // Prefer date_of_birth; fall back to legacy dob if present
        date_of_birth: initial.date_of_birth || initial.dob || '',
        // Prefer grade_level; fall back to legacy grade if present
        grade_level: initial.grade_level || initial.grade || '',
        address: initial.address || '',
        phone: initial.phone || '',
      });
    }
  }, [initial]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const { valid, errors: ve } = validateStudent(values);
    setErrors(ve);
    if (!valid) return;
    try {
      setBusy(true);
      await onSubmit(values);
    } finally {
      setBusy(false);
    }
  };

  const title = initial ? 'Edit Student' : 'Add Student';

  return (
    <form onSubmit={submit} className="card form-card" aria-label="student-form">
      <h3 className="card-title">{title}</h3>

      <div className="grid-2">
        <div className="form-control">
          <label htmlFor="first_name">First Name</label>
          <input id="first_name" name="first_name" value={values.first_name} onChange={onChange} placeholder="John" />
          {errors.first_name && <span className="error">{errors.first_name}</span>}
        </div>

        <div className="form-control">
          <label htmlFor="last_name">Last Name</label>
          <input id="last_name" name="last_name" value={values.last_name} onChange={onChange} placeholder="Doe" />
          {errors.last_name && <span className="error">{errors.last_name}</span>}
        </div>
      </div>

      <div className="grid-2">
        <div className="form-control">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={values.email} onChange={onChange} placeholder="john@example.com" />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>

        <div className="form-control">
          <label htmlFor="date_of_birth">Date of Birth</label>
          <input id="date_of_birth" name="date_of_birth" type="date" value={values.date_of_birth} onChange={onChange} />
          {errors.date_of_birth && <span className="error">{errors.date_of_birth}</span>}
        </div>
      </div>

      <div className="grid-2">
        <div className="form-control">
          <label htmlFor="grade_level">Grade</label>
          <input id="grade_level" name="grade_level" value={values.grade_level} onChange={onChange} placeholder="10 or Grade 10" />
          {errors.grade_level && <span className="error">{errors.grade_level}</span>}
        </div>

        <div className="form-control">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" value={values.phone} onChange={onChange} placeholder="+1 555-123-4567" />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>
      </div>

      <div className="form-control">
        <label htmlFor="address">Address</label>
        <input id="address" name="address" value={values.address} onChange={onChange} placeholder="123 Main St, Springfield" />
        {errors.address && <span className="error">{errors.address}</span>}
      </div>

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
