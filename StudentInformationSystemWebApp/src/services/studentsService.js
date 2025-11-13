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
   * Optional: date_of_birth (YYYY-MM-DD), grade_level (text <= 20 chars), address, phone.
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
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) errors.email = 'Invalid email format';
  }

  if (s.date_of_birth) {
    const dob = String(s.date_of_birth).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      errors.date_of_birth = 'Use format YYYY-MM-DD';
    }
  }

  if (s.grade_level != null && String(s.grade_level).length > 20) {
    errors.grade_level = 'Max 20 characters';
  }

  if (s.phone && String(s.phone).length > 40) {
    errors.phone = 'Max 40 characters';
  }

  if (s.address && String(s.address).length > 200) {
    errors.address = 'Max 200 characters';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// PUBLIC_INTERFACE
export async function listStudents() {
  /** Fetches all students ordered by created_at desc. */
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (e) {
    log('ERROR', 'students.list_supabase_not_configured', { error: e.message });
    throw new Error('Supabase not configured. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY).');
  }

  const start = Date.now();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  const duration = Date.now() - start;

  if (error) {
    log('ERROR', 'students.list_failed', { duration_ms: duration, error: error.message });
    throw new Error('Failed to fetch students. Verify RLS allows anon select and your Supabase URL/key are correct.');
  }
  log('INFO', 'students.list_success', { duration_ms: duration, count: data?.length || 0 });
  return data || [];
}

// PUBLIC_INTERFACE
export async function addStudent(student) {
  /** Inserts a new student record with only existing columns. */
  const { valid, errors } = validateStudent(student);
  if (!valid) {
    log('WARN', 'students.add_validation_failed', { errors });
    const e = new Error('Validation failed');
    e.validation = errors;
    throw e;
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (e) {
    log('ERROR', 'students.add_supabase_not_configured', { error: e.message });
    throw new Error('Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY).');
  }
  const payload = sanitize(student);

  log('INFO', 'students.add_payload_keys', redactForLogging(payload));

  const start = Date.now();
  const { data, error } = await supabase.from(TABLE).insert([payload]).select().single();
  const duration = Date.now() - start;

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    let userMessage = 'Failed to add student';

    if (msg.includes('unique') && msg.includes('email')) {
      userMessage = 'Email already exists. Please use a different email.';
    }
    if (msg.includes('rls') || msg.includes('row level security') || msg.includes('permission denied') || msg.includes('not allowed')) {
      userMessage = 'Insert blocked by RLS policy. Ensure anon (or authenticated) role has INSERT on public.students.';
    }
    if (msg.includes('null value') && (msg.includes('first_name') || msg.includes('last_name') || msg.includes('email'))) {
      userMessage = 'Missing required fields. Please provide first name, last name, and a valid email.';
    }
    if (msg.includes('column')) {
      userMessage = 'Unexpected column in payload. Please update the app to the latest version.';
    }

    log('ERROR', 'students.add_failed', {
      duration_ms: duration,
      error: error.message,
      fields_present: {
        first_name: Boolean(payload.first_name),
        last_name: Boolean(payload.last_name),
        email: Boolean(payload.email),
        date_of_birth: 'date_of_birth' in payload,
        grade_level: 'grade_level' in payload,
        address: 'address' in payload,
        phone: 'phone' in payload
      }
    });
    const e = new Error(userMessage);
    e.details = { raw: error.message };
    throw e;
  }
  log('INFO', 'students.add_success', { duration_ms: duration, id: data?.id });
  return data;
}

// PUBLIC_INTERFACE
export async function updateStudent(id, student) {
  /** Updates an existing student record by id with only existing columns. */
  if (!id) throw new Error('Missing id');

  const { valid, errors } = validateStudent(student);
  if (!valid) {
    log('WARN', 'students.update_validation_failed', { id, errors });
    const e = new Error('Validation failed');
    e.validation = errors;
    throw e;
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (e) {
    log('ERROR', 'students.update_supabase_not_configured', { id, error: e.message });
    throw new Error('Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY).');
  }
  const payload = sanitize(student);

  log('INFO', 'students.update_payload_keys', { id, ...redactForLogging(payload) });

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

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (e) {
    log('ERROR', 'students.delete_supabase_not_configured', { id, error: e.message });
    throw new Error('Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY).');
  }
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

/**
 * Create a redacted copy of payload for logging to verify keys without PII.
 */
function redactForLogging(payload) {
  if (!payload) return {};
  return {
    has_first_name: Boolean(payload.first_name),
    has_last_name: Boolean(payload.last_name),
    has_email: Boolean(payload.email),
    keys: Object.keys(payload).sort(),
  };
}

/**
 * Normalize UI model to database column names (only supported columns):
 * - first_name, last_name, email, date_of_birth, grade_level, address, phone
 * Legacy note: accept 'dob' and 'grade' on input, map internally, but never emit them.
 */
function sanitize(s) {
  const trimmed = {
    first_name: String(s.first_name || '').trim(),
    last_name: String(s.last_name || '').trim(),
    email: String(s.email || '').trim().toLowerCase(),
    date_of_birth: s.date_of_birth
      ? String(s.date_of_birth).trim()
      : (s.dob ? String(s.dob).trim() : null),
    grade_level: s.grade_level != null
      ? String(s.grade_level).trim()
      : (s.grade != null ? String(s.grade).trim() : null),
    address: s.address ? String(s.address).trim() : null,
    phone: s.phone ? String(s.phone).trim() : null,
  };

  const out = {};
  Object.keys(trimmed).forEach((k) => {
    if (trimmed[k] !== null && trimmed[k] !== undefined && trimmed[k] !== '') out[k] = trimmed[k];
  });

  return out;
}
