import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentForm from "../components/StudentForm";
import { createStudent } from "../services/studentService";
import { uniquenessHintForEmail } from "../utils/validation";

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
      // eslint-disable-next-line no-alert
      const msg = err?.message || "Create failed";
      // If generic uniqueness message, append a friendly hint
      const enhanced =
        msg.toLowerCase().includes("unique") ? `${msg}\n\n${uniquenessHintForEmail()}` : msg;
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
