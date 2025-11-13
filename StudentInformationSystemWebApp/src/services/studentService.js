import { getSupabaseClient } from "../lib/supabaseClient";
import { mapSupabaseErrorToMessage, logMinimalError } from "./errorMapping";

/**
 * Student Service provides CRUD operations for the 'students' table.
 * Columns expected: id (uuid), first_name, last_name, email, enrollment_date,
 * status, age, created_at, and generated name (stored).
 * UI components mostly refer to "name", "email", "age" for listing.
 */

// Shared error formatter that maps underlying errors to friendly messages
function formatError(prefix, error, action) {
  const friendly = mapSupabaseErrorToMessage(error, { action });
  logMinimalError(prefix, error);
  return new Error(friendly);
}

// PUBLIC_INTERFACE
export async function listStudents({ limit = 100, offset = 0, orderBy = "created_at", ascending = false } = {}) {
  /** Lists students with pagination and ordering. */
  const supabase = getSupabaseClient();

  // Defensive normalization for parameters
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 100;
  const safeOffset = Math.max(0, Number.isFinite(Number(offset)) ? Number(offset) : 0);
  const start = safeOffset;
  const end = start + safeLimit - 1;

  // Build query step-by-step to avoid premature await; select returns a builder
  const query = supabase
    .from("students")
    .select("*", { count: "exact" })
    .order(orderBy || "created_at", { ascending: !!ascending })
    .range(start, end);

  const { data, error, count } = await query;
  if (error) {
    throw formatError("listStudents", error, "listing");
  }
  return { data: data || [], count: count ?? 0 };
}

// PUBLIC_INTERFACE
export async function getStudentById(id) {
  /** Retrieves a student by primary key id. */
  if (!id) throw new Error("getStudentById requires 'id'");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
  if (error) {
    throw formatError("getStudentById", error, "retrieval");
  }
  return data;
}

// PUBLIC_INTERFACE
export async function createStudent(payload) {
  /** Creates a new student. Payload should match table schema. */
  if (!payload || typeof payload !== "object") throw new Error("createStudent requires a payload object");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("students").insert(payload).select().single();
  if (error) {
    throw formatError("createStudent", error, "creation");
  }
  return data;
}

// PUBLIC_INTERFACE
export async function updateStudent(id, updates) {
  /** Updates an existing student by id with fields in updates object. */
  if (!id) throw new Error("updateStudent requires 'id'");
  if (!updates || typeof updates !== "object") throw new Error("updateStudent requires an updates object");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("students").update(updates).eq("id", id).select().single();
  if (error) {
    throw formatError("updateStudent", error, "update");
  }
  return data;
}

// PUBLIC_INTERFACE
export async function deleteStudent(id) {
  /** Deletes a student by id. Returns true on success. */
  if (!id) throw new Error("deleteStudent requires 'id'");
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) {
    throw formatError("deleteStudent", error, "deletion");
  }
  return true;
}
