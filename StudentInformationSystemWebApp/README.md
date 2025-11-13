# Student Information System (React + Supabase)

This app manages student records with a responsive green-themed UI and Supabase CRUD.

Quick start:
- Copy `.env.example` to `.env` and set:
  - REACT_APP_SUPABASE_URL
  - REACT_APP_SUPABASE_ANON_KEY (preferred) or REACT_APP_SUPABASE_KEY
- `npm install`
- `npm start` (runs on port 3000)
- `npm test`

Troubleshooting:
- If you see "Could not load students. Check Supabase configuration.", open the browser console.
- Look for "[SIS] Supabase env diagnostics" to confirm which env variables were detected and any issues.
- Ensure RLS allows anon select on public.students as per README.SIS.md.

Add-student failures:
- "Email already exists. Please use a different email." → Your public.students table enforces unique email; use a different address.
- "Insert blocked by RLS policy..." → Enable RLS and add an INSERT policy for the active role (anon or authenticated). For demo, see permissive policies in README.SIS.md.
- Generic "Failed to add student" → Open console for [SIS] students.add_failed details. Verify:
  1) REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set (see .env.example)
  2) public.students has required columns: first_name, last_name, email (not null)
  3) RLS policies permit INSERT for your role

Supabase schema (public.students) used by the app:
- id uuid pk default gen_random_uuid()
- first_name text not null
- last_name text not null
- email text unique not null
- date_of_birth date null
- grade_level text null
- address text null
- phone text null
- created_at timestamptz default now()

Search, Filters, Pagination, and Sorting:
- Top navigation includes a search bar with filters. Available filters:
  - q: free text; applies to first_name, last_name, and email using ilike
  - first_name: ilike match
  - last_name: ilike match
  - email: ilike match
  - grade_level: exact match (eq); use q for broad matching if needed
  - date_of_birth range: dob_start (>= YYYY-MM-DD), dob_end (<= YYYY-MM-DD)
- Date format must be YYYY-MM-DD. If invalid, the date filter is ignored and a small inline hint shows.
- Results update with a short debounce as you type. Click Search to submit immediately or Clear to reset all filters.
- Empty state shows guidance to adjust filters or add a new student.
- Server-backed pagination:
  - Use the Prev/Next buttons and the "Rows per page" selector (10/25/50/100).
  - The footer shows "Showing X-Y of Z".
  - State is preserved in URL query params: page, pageSize.
- Sorting:
  - Click table headers to sort by: first_name, last_name, email, grade_level, date_of_birth, created_at.
  - Sorting toggles asc/desc on repeated clicks; state is preserved in URL as sortBy, sortDir.
  - Sorting keys are whitelisted to avoid errors; legacy fields are not used.

Notes on fields:
- The UI collects "Date of Birth" and sends it to the database as "date_of_birth".
- The UI sends grade as "grade_level".
- Optional fields address and phone may be sent if present in your schema; otherwise they are ignored by the database.

RLS (demo): enable row level security and allow anon select/insert/update/delete (see README.SIS.md).

See README.SIS.md for full setup, schema, and usage details.
