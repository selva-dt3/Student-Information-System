import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentForm from "../components/StudentForm";
import { getStudentById, updateStudent } from "../services/studentService";
import { uniquenessHintForEmail } from "../utils/validation";
import { mapSupabaseErrorToMessage, logMinimalError } from "../services/errorMapping";

/**
 * Edit page for updating an existing student
 */
export default function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await getStudentById(id);
        if (!cancelled) {
          setInitial({
            firstName: s.firstName || "",
            lastName: s.lastName || "",
            email: s.email || "",
            enrollmentDate: s.enrollmentDate || "",
            status: s.status || "active",
            age: s.age ?? ""
          });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (updates) => {
    setSubmitting(true);
    try {
      await updateStudent(id, updates);
      navigate("/");
    } catch (err) {
      // Map error to friendly message and log minimally
      const base = mapSupabaseErrorToMessage(err, { action: "update" });
      logMinimalError("StudentEdit.update", err);
      const enhanced =
        base.toLowerCase().includes("unique") ? `${base}\n\n${uniquenessHintForEmail()}` : base;
      // eslint-disable-next-line no-alert
      alert(enhanced);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="sis-container"><div className="sis-info">Loading...</div></div>;
  if (error) return <div className="sis-container"><div className="sis-error">Error: {error.message}</div></div>;
  if (!initial) return <div className="sis-container"><div className="sis-error">Student not found</div></div>;

  return (
    <div className="sis-container">
      <h2 className="sis-title">Edit Student</h2>
      <StudentForm initialValues={initial} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
