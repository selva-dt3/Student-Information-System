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
- dob date null
- grade text null
- created_at timestamptz default now()

Notes on fields:
- The UI collects "Date of Birth" and sends it to the database as the "dob" column.
- The app no longer uses an "age" field. If your table previously had an "age" column, remove it or ignore it; the app will not send it.
- Optional fields address and phone may be sent if present in your schema; otherwise they are ignored by the database.

RLS (demo): enable row level security and allow anon select/insert/update/delete (see README.SIS.md).

See README.SIS.md for full setup, schema, and usage details.
