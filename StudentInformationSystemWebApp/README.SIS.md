# Student Information System Web App

A simple, single-page React app to manage students with Supabase as the backend. Features:
- Add, view, edit, delete student records
- Client-side validation
- Responsive, green-themed UI with light/dark toggle
- Basic structured logging to console
- Runs on port 3000 (Create React App default)

## Prerequisites

- Node.js 18+
- A Supabase project with a `students` table
- Environment variables configured for Supabase

## Environment Variables

Set these in your environment (e.g., a local `.env` file at the project root of this app). Copy `.env.example` to `.env` and fill in your values:

- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

The project already has other REACT_APP_* variables available; we only use the two above specifically for Supabase.

Example `.env.example` is included in the repo.

Note: Do not commit actual secrets.

## Supabase Table Schema

Create a table named `students` with columns:
- id: uuid primary key default gen_random_uuid()
- first_name: text not null
- last_name: text not null
- email: text unique not null
- dob: date null
- grade: text null
- created_at: timestamptz default now()

In SQL (Postgres):
```sql
create extension if not exists pgcrypto;
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique not null,
  dob date null,
  grade text,
  created_at timestamptz default now()
);
```

Enable RLS and, for demo use, you may add permissive anon policies:

```sql
alter table public.students enable row level security;

create policy "Students read for anon" on public.students
for select using (true);

create policy "Students insert for anon" on public.students
for insert with check (true);

create policy "Students update for anon" on public.students
for update using (true) with check (true);

create policy "Students delete for anon" on public.students
for delete using (true);
```

Warning: These policies allow full read/write with the anon key. Use stricter policies for production.

## Install & Run

1. Install dependencies
```
npm install
```

2. Start the app
```
npm start
```
Open http://localhost:3000

3. Run tests
```
npm test
```

## Usage

- Use "+ Add Student" to create a record.
- Click "Edit" to modify.
- Click "Delete" to remove; a confirmation dialog will appear.

## Logging

The app logs structured messages to the browser console in JSON format for key actions like list/add/update/delete.

## Notes

- All operations are performed directly from the client using the Supabase JavaScript client.
- Ensure RLS policies permit the anon key to perform desired actions for your use case (demo vs production).
