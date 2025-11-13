import React, { useEffect, useState } from 'react';
import { validateStudent } from '../services/studentsService';

/**
 * StudentForm component for creating/updating a student.
 * Props:
 * - initial: optional student object to edit
 * - onCancel: function
 * - onSubmit: async function(student) -> Promise
 */
export default function StudentForm({ initial = null, onCancel, onSubmit }) {
  const [values, setValues] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: '',
    grade: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setValues({
        first_name: initial.first_name || '',
        last_name: initial.last_name || '',
        email: initial.email || '',
        age: initial.age == null ? '' : String(initial.age),
        grade: initial.grade || '',
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
          <label htmlFor="age">Age</label>
          <input id="age" name="age" type="number" min="3" max="120" value={values.age} onChange={onChange} placeholder="18" />
          {errors.age && <span className="error">{errors.age}</span>}
        </div>
      </div>

      <div className="form-control">
        <label htmlFor="grade">Grade</label>
        <input id="grade" name="grade" value={values.grade} onChange={onChange} placeholder="10" />
        {errors.grade && <span className="error">{errors.grade}</span>}
      </div>

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
