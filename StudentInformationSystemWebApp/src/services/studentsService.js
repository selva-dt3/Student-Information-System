import { getSupabaseClient } from '../supabaseClient';

const TABLE = 'students';

// Simple structured logger
function log(level, message, metadata = {}) {
  const levelUpper = (level || 'INFO').toUpperCase();
  const entry = {
    timestamp: new Date().toISOString(),
    level: levelUpper,
    service: 'StudentInformationSystemWebApp',
    action: message,
    metadata,
  };
  // eslint-disable-next-line no-console
  console[levelLower(levelUpper)]?.(JSON.stringify(entry)) || console.log(JSON.stringify(entry));
}

function levelLower(level) {
  switch (level) {
    case 'ERROR':
      return 'error';
    case 'WARN':
      return 'warn';
    case 'INFO':
    default:
      return 'log';
  }
}

// PUBLIC_INTERFACE
export function validateStudent(student) {
  /**
   * Validates a student object and returns { valid: boolean, errors: Record<string,string> }.
   * Required fields: first_name, last_name, email.
   * Optional: age (>= 3 and <= 120), grade (K-12 or other text up to 10 chars).
   */
  const errors = {};
  const s = student || {};

  const required = ['first_name', 'last_name', 'email'];
  required.forEach((k) => {
    if (!s[k] || String(s[k]).trim().length === 0) {
      errors[k] = 'Required';
    }
  });

  if (s.email) {
    const email = String(s.email).trim();
    // Simple email regex
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) errors.email = 'Invalid email format';
  }

  if (s.age != null && s.age !== '') {
    const n = Number(s.age);
    if (Number.isNaN(n)) errors.age = 'Age must be a number';
    else if (n < 3 || n > 120) errors.age = 'Age must be between 3 and 120';
  }

  if (s.grade != null && String(s.grade).length > 10) {
    errors.grade = 'Max 10 characters';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// PUBLIC_INTERFACE
export async function listStudents() {
  /** Fetches all students ordered by created_at desc. */
  const supabase = getSupabaseClient();
  const start = Date.now();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  const duration = Date.now() - start;

  if (error) {
    log('ERROR', 'students.list_failed', { duration_ms: duration, error: error.message });
    throw new Error('Failed to fetch students');
  }
  log('INFO', 'students.list_success', { duration_ms: duration, count: data?.length || 0 });
  return data || [];
}

// PUBLIC_INTERFACE
export async function addStudent(student) {
  /** Inserts a new student record. */
  const { valid, errors } = validateStudent(student);
  if (!valid) {
    log('WARN', 'students.add_validation_failed', { errors });
    const e = new Error('Validation failed');
    e.validation = errors;
    throw e;
  }

  const supabase = getSupabaseClient();
  const payload = sanitize(student);
  const start = Date.now();
  const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
  const duration = Date.now() - start;

  if (error) {
    log('ERROR', 'students.add_failed', { duration_ms: duration, error: error.message });
    throw new Error('Failed to add student');
  }
  log('INFO', 'students.add_success', { duration_ms: duration, id: data?.id });
  return data;
}

// PUBLIC_INTERFACE
export async function updateStudent(id, student) {
  /** Updates an existing student record by id. */
  if (!id) throw new Error('Missing id');

  const { valid, errors } = validateStudent(student);
  if (!valid) {
    log('WARN', 'students.update_validation_failed', { id, errors });
    const e = new Error('Validation failed');
    e.validation = errors;
    throw e;
  }

  const supabase = getSupabaseClient();
  const payload = sanitize(student);
  const start = Date.now();
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  const duration = Date.now() - start;

  if (error) {
    log('ERROR', 'students.update_failed', { id, duration_ms: duration, error: error.message });
    throw new Error('Failed to update student');
  }
  log('INFO', 'students.update_success', { id, duration_ms: duration });
  return data;
}

// PUBLIC_INTERFACE
export async function deleteStudent(id) {
  /** Deletes a student by id. */
  if (!id) throw new Error('Missing id');

  const supabase = getSupabaseClient();
  const start = Date.now();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  const duration = Date.now() - start;

  if (error) {
    log('ERROR', 'students.delete_failed', { id, duration_ms: duration, error: error.message });
    throw new Error('Failed to delete student');
  }
  log('INFO', 'students.delete_success', { id, duration_ms: duration });
  return true;
}

function sanitize(s) {
  // Basic trimming to avoid leading/trailing spaces; never log sensitive data
  const out = {
    first_name: String(s.first_name || '').trim(),
    last_name: String(s.last_name || '').trim(),
    email: String(s.email || '').trim().toLowerCase(),
    age: s.age === '' || s.age == null ? null : Number(s.age),
    grade: s.grade == null ? null : String(s.grade).trim(),
  };
  return out;
}
