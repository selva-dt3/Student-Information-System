import React, { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * StudentForm: Controlled form with simple validations for name, email, age
 */
export default function StudentForm({ initialValues = { name: "", email: "", age: "" }, onSubmit, submitting }) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => setForm(initialValues), [initialValues]);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.email?.trim()) e.email = "Email is required";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Invalid email";
    if (form.age === "" || form.age === null || form.age === undefined) e.age = "Age is required";
    else if (Number.isNaN(Number(form.age))) e.age = "Age must be a number";
    else if (Number(form.age) < 0) e.age = "Age must be positive";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "age" ? value.replace(/[^\d]/g, "") : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, age: Number(form.age) });
  };

  return (
    <form className="sis-form" onSubmit={handleSubmit} noValidate aria-label="Student form">
      <div className="sis-form-row">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" className="sis-input" value={form.name} onChange={handleChange} required aria-invalid={!!errors.name} />
        {errors.name && <div className="sis-error" role="alert">{errors.name}</div>}
      </div>
      <div className="sis-form-row">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" className="sis-input" value={form.email} onChange={handleChange} required aria-invalid={!!errors.email} />
        {errors.email && <div className="sis-error" role="alert">{errors.email}</div>}
      </div>
      <div className="sis-form-row">
        <label htmlFor="age">Age</label>
        <input id="age" name="age" className="sis-input" value={form.age} onChange={handleChange} inputMode="numeric" required aria-invalid={!!errors.age} />
        {errors.age && <div className="sis-error" role="alert">{errors.age}</div>}
      </div>
      <div className="sis-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
