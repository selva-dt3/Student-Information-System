import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentForm from "../components/StudentForm";
import { createStudent } from "../services/studentService";
import { uniquenessHintForEmail } from "../utils/validation";
import { mapSupabaseErrorToMessage, logMinimalError } from "../services/errorMapping";

/**
 * Create page for adding a new student
 */
export default function StudentCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createStudent(payload);
      navigate("/");
    } catch (err) {
      // Map error using centralized mapping and log minimally
      const base = mapSupabaseErrorToMessage(err, { action: "creation" });
      logMinimalError("StudentCreate.create", err);
      const enhanced =
        base.toLowerCase().includes("unique") ? `${base}\n\n${uniquenessHintForEmail()}` : base;
      // eslint-disable-next-line no-alert
      alert(enhanced);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sis-container">
      <h2 className="sis-title">New Student</h2>
      <StudentForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
