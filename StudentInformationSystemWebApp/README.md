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

Supabase schema (public.students):
- id uuid pk default gen_random_uuid()
- first_name text not null
- last_name text not null
- email text unique not null
- dob date null
- grade text null
- created_at timestamptz default now()

RLS (demo): enable row level security and allow anon select/insert/update/delete (see README.SIS.md).

See README.SIS.md for full setup, schema, and usage details.
