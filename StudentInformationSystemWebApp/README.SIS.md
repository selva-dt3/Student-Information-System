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

Set these in your environment (e.g., a local `.env` file at project root of this app):

- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

The project already has other REACT_APP_* variables available; we only use the two above specifically for Supabase.

Example `.env.example`:
```
REACT_APP_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
# Optional:
REACT_APP_NODE_ENV=development
```

Note: Do not commit actual secrets.

## Supabase Table Schema

Create a table named `students` with columns:
- id: uuid (default: gen_random_uuid()) or bigint with identity
- first_name: text not null
- last_name: text not null
- email: text not null
- age: int4 null
- grade: text null
- created_at: timestamptz default now()

In SQL (Postgres):
```sql
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  age int,
  grade text,
  created_at timestamptz default now()
);
```
Set Row Level Security (RLS) as needed. For quick demos, you can enable read/write for anon role via policies.

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
