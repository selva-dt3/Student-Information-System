import React, { useEffect, useMemo, useState } from "react";
import FormError from "./FormError";
import { validateStudentForm } from "../utils/validation";
import { logMinimalError } from "../services/errorMapping";

/**
 * PUBLIC_INTERFACE
 * StudentForm: Controlled form with robust validations (first/last name, email, enrollment date, status, optional age)
 *
 * Props:
 * - initialValues: {
 *     firstName: string,
 *     lastName: string,
 *     email: string,
 *     enrollmentDate: string (YYYY-MM-DD),
 *     status: "active"|"inactive"|"suspended",
 *     age?: number|string
 *   }
 * - onSubmit: function(payload) -> void
 * - submitting: boolean
 */
export default function StudentForm({
  initialValues = { firstName: "", lastName: "", email: "", enrollmentDate: "", status: "active", age: "" },
  onSubmit,
  submitting
}) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const errorIds = useMemo(
    () => ({
      firstName: "err-first-name",
      lastName: "err-last-name",
      email: "err-email",
      enrollmentDate: "err-enrollment-date",
      status: "err-status",
      age: "err-age"
    }),
    []
  );

  useEffect(() => setForm(initialValues), [initialValues]);

  const runValidation = (nextForm = form) => {
    const { errors: e, valid } = validateStudentForm(nextForm);
    setErrors(e);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = name === "age" ? value.replace(/[^\d]/g, "") : value;
    const next = { ...form, [name]: v };
    setForm(next);
  };

  const handleBlur = () => {
    const valid = runValidation();
    if (!valid) {
      logMinimalError("StudentForm.blurValidation", { code: "FIELD_ERRORS" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!runValidation()) {
      // Minimal logging to indicate validation prevented submit
      logMinimalError("StudentForm.submitBlocked", { code: "VALIDATION_FAILED" });
      return;
    }
    const payload = {
      ...form,
      age: form.age === "" ? null : Number(form.age)
    };
    onSubmit(payload);
  };

  return (
    <form className="sis-form" onSubmit={handleSubmit} noValidate aria-label="Student form">
      <div className="sis-form-row">
        <label htmlFor="firstName">First name</label>
        <input
          id="firstName"
          name="firstName"
          className="sis-input"
          value={form.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? errorIds.firstName : undefined}
        />
        <FormError id={errorIds.firstName} message={errors.firstName} />
      </div>

      <div className="sis-form-row">
        <label htmlFor="lastName">Last name</label>
        <input
          id="lastName"
          name="lastName"
          className="sis-input"
          value={form.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? errorIds.lastName : undefined}
        />
        <FormError id={errorIds.lastName} message={errors.lastName} />
      </div>

      <div className="sis-form-row">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          className="sis-input"
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? errorIds.email : undefined}
          inputMode="email"
        />
        <FormError id={errorIds.email} message={errors.email} />
      </div>

      <div className="sis-form-row">
        <label htmlFor="enrollmentDate">Enrollment date</label>
        <input
          id="enrollmentDate"
          name="enrollmentDate"
          className="sis-input"
          value={form.enrollmentDate}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="YYYY-MM-DD"
          required
          aria-invalid={!!errors.enrollmentDate}
          aria-describedby={errors.enrollmentDate ? errorIds.enrollmentDate : undefined}
        />
        <FormError id={errorIds.enrollmentDate} message={errors.enrollmentDate} />
      </div>

      <div className="sis-form-row">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          className="sis-input"
          value={form.status}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-invalid={!!errors.status}
          aria-describedby={errors.status ? errorIds.status : undefined}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <FormError id={errorIds.status} message={errors.status} />
      </div>

      <div className="sis-form-row">
        <label htmlFor="age">Age (optional)</label>
        <input
          id="age"
          name="age"
          className="sis-input"
          value={form.age}
          onChange={handleChange}
          onBlur={handleBlur}
          inputMode="numeric"
          aria-invalid={!!errors.age}
          aria-describedby={errors.age ? errorIds.age : undefined}
        />
        <FormError id={errorIds.age} message={errors.age} />
      </div>

      <div className="sis-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
