//
// Client-side validation utilities for Student Information System
// Provides field-level validators and a form-level validate function.
//
// Note: Email uniqueness is enforced by Supabase (unique index). We only provide a hint on conflict.
//

/**
 * Determine current log level threshold from env.
 * Values: error (0), warn (1), info (2), debug (3)
 */
function getLogLevelRank() {
  const level = (process.env.REACT_APP_LOG_LEVEL || "info").toLowerCase();
  const map = { error: 0, warn: 1, info: 2, debug: 3 };
  return map[level] ?? 2;
}

function logDebugNonPII(message, meta) {
  // Only log minimal, non-PII details
  if (getLogLevelRank() >= 3) {
    // Avoid logging raw form values or emails/names; keep generic metadata
    // eslint-disable-next-line no-console
    console.debug("[validation]", message, meta ? { ...meta } : undefined);
  }
}

// PUBLIC_INTERFACE
export function validateFirstName(value) {
  /** Validate first name: required, letters and common punctuation, max 50 */
  const v = String(value || "").trim();
  if (!v) return "First name is required";
  if (v.length > 50) return "First name must be at most 50 characters";
  if (!/^[a-zA-Z ,.'-]+$/.test(v)) return "First name contains invalid characters";
  return "";
}

// PUBLIC_INTERFACE
export function validateLastName(value) {
  /** Validate last name: required, letters and common punctuation, max 50 */
  const v = String(value || "").trim();
  if (!v) return "Last name is required";
  if (v.length > 50) return "Last name must be at most 50 characters";
  if (!/^[a-zA-Z ,.'-]+$/.test(v)) return "Last name contains invalid characters";
  return "";
}

// PUBLIC_INTERFACE
export function validateEmail(value) {
  /** Validate email address format */
  const v = String(value || "").trim();
  if (!v) return "Email is required";
  // Basic RFC5322-light regex for client-side
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email format";
  return "";
}

// PUBLIC_INTERFACE
export function uniquenessHintForEmail() {
  /**
   * Returns a generic hint to show when backend returns unique_violation for the email.
   * Avoids implying which email already exists (no PII).
   */
  return "That email is already in use. Please use a different email address.";
}

// PUBLIC_INTERFACE
export function validateEnrollmentDate(value) {
  /** Validate enrollment date: required, valid date string (YYYY-MM-DD) and not in distant future */
  const v = String(value || "").trim();
  if (!v) return "Enrollment date is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Enrollment date must be in YYYY-MM-DD format";
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "Enrollment date is invalid";
  const now = new Date();
  const futureCutoff = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (date > futureCutoff) return "Enrollment date cannot be too far in the future";
  return "";
}

// PUBLIC_INTERFACE
export function validateStatus(value) {
  /** Validate status: required, one of active|inactive|suspended */
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "Status is required";
  const allowed = ["active", "inactive", "suspended"];
  if (!allowed.includes(v)) return "Status must be one of: active, inactive, suspended";
  return "";
}

// PUBLIC_INTERFACE
export function validateStudentForm(values) {
  /**
   * Validate a student form with fields:
   * { firstName, lastName, email, enrollmentDate, status, age? }
   * Returns { errors, valid }
   */
  const errors = {};
  errors.firstName = validateFirstName(values.firstName);
  errors.lastName = validateLastName(values.lastName);
  errors.email = validateEmail(values.email);
  errors.enrollmentDate = validateEnrollmentDate(values.enrollmentDate);
  errors.status = validateStatus(values.status);

  // age is optional in this rule-set; keep legacy Age if used
  if ("age" in values) {
    const a = values.age;
    if (a === "" || a === null || a === undefined) {
      // optional: do nothing
    } else if (Number.isNaN(Number(a))) {
      errors.age = "Age must be a number";
    } else if (Number(a) < 0) {
      errors.age = "Age must be positive";
    }
  }

  // prune empty messages
  Object.keys(errors).forEach((k) => {
    if (!errors[k]) delete errors[k];
  });

  logDebugNonPII("validateStudentForm", { fields: Object.keys(values || {}) });
  return { errors, valid: Object.keys(errors).length === 0 };
}
