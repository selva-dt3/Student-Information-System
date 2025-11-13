# Supabase Setup for Student Information System

## Overview

This guide describes how to provision the Supabase backend for the Student Information System (SIS) web app. It includes the SQL schema for the students table, demo Row Level Security (RLS) policies, optional realtime configuration, and environment variable setup required by the app.

The frontend connects directly to Supabase using:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

Feature flags and log level are controlled via:
- REACT_APP_FEATURE_FLAGS
- REACT_APP_LOG_LEVEL

## Prerequisites

- A Supabase project: https://supabase.com
- Access to the SQL Editor in your Supabase project
- Supabase Realtime enabled (optional for realtime updates)

## Database Schema

Run the following SQL in the Supabase SQL Editor to create the students table. The table includes common fields referenced by the app and tests.

```sql
-- Schema: public
-- Table: public.students

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  -- Display name (for list views)
  name text generated always as (
    trim(
      coalesce(first_name, '') || ' ' || coalesce(last_name, '')
    )
  ) stored,

  -- Detailed student fields used by the UI form
  first_name text not null,
  last_name text not null,
  email text not null unique,
  enrollment_date date not null,
  status text not null check (status in ('active', 'inactive', 'suspended')),
  age int,

  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_students_created_at on public.students (created_at desc);
create index if not exists idx_students_email on public.students (email);
```

Notes:
- The UI’s list view displays name, email, and age. Internally, name is generated from first_name and last_name to keep consistency.
- Client validation mirrors these constraints (email format, status allowed values, positive age when provided, etc.).

## Row Level Security (RLS)

Enable RLS and add demo policies. For production, restrict to authenticated users and apply your organization’s rules. The policies below are suitable for a demo or internal environments.

```sql
-- Enable RLS
alter table public.students enable row level security;

-- Demo policy: allow anonymous read (SELECT)
drop policy if exists "Allow read to anon" on public.students;
create policy "Allow read to anon"
on public.students
for select
to anon
using (true);

-- Demo policy: allow inserts by anon
drop policy if exists "Allow insert to anon" on public.students;
create policy "Allow insert to anon"
on public.students
for insert
to anon
with check (true);

-- Demo policy: allow updates by anon
drop policy if exists "Allow update to anon" on public.students;
create policy "Allow update to anon"
on public.students
for update
to anon
using (true)
with check (true);

-- Demo policy: allow deletes by anon
drop policy if exists "Allow delete to anon" on public.students;
create policy "Allow delete to anon"
on public.students
for delete
to anon
using (true);
```

Production guidance:
- Replace anon with authenticated for policies and require logged-in users.
- Add ownership constraints (e.g., user_id column referencing auth.uid()) and ensure using() and with check() enforce per-user access.

## Realtime

The app can subscribe to realtime changes on public.students when the realtime feature flag is enabled.

Steps:
1) In Supabase, open Realtime settings and ensure that your database or the public schema is enabled for Realtime.
2) Confirm changes on the students table are included in Realtime (INSERT, UPDATE, DELETE).

No additional SQL is required beyond enabling Realtime for the schema/table.

In the app, enable the feature:
- REACT_APP_FEATURE_FLAGS=realtime

The hook src/hooks/useRealtimeStudents.js handles subscription when the feature is present.

## Environment Variables

Create Student-Information-System/StudentInformationSystemWebApp/.env using the provided template:

```
cp .env.example .env
```

Fill:
- REACT_APP_SUPABASE_URL=your-project-url
- REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key

Optional:
- REACT_APP_FEATURE_FLAGS=realtime
- REACT_APP_LOG_LEVEL=info

Notes:
- FEATURE_FLAGS is a comma-separated list. To disable realtime, remove realtime or leave it empty.
- LOG_LEVEL supports: error, warn, info, debug.

## End-to-End Setup Steps

1) Create Supabase project or use an existing one.
2) Run the Database Schema SQL above in the SQL Editor.
3) Apply the Demo RLS Policies for initial testing (or configure production-grade ones).
4) Enable Realtime for the public schema or specifically for the students table if you want live updates.
5) Copy .env.example to .env and fill REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY:
   - REACT_APP_SUPABASE_URL: Project Settings → API → Project URL
   - REACT_APP_SUPABASE_ANON_KEY: Project Settings → API → anon public
6) Start the app:
   - npm install
   - npm start
7) Visit http://localhost:3000 and begin creating students.

## Troubleshooting

- Permission denied (code 42501): Your RLS policies likely block the action. For a demo, use the permissive policies above. For production, review your authenticated user policies.
- Unique violations on email (code 23505): The app displays a friendly message; ensure you use a unique email per student.
- Missing environment variables: The app logs guidance at startup. Ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in .env.
- Realtime does not update: Verify REACT_APP_FEATURE_FLAGS contains realtime and that Realtime is enabled in Supabase for the public.students table.

## References

- src/lib/supabaseClient.js for client initialization
- src/services/studentService.js for CRUD operations
- src/hooks/useRealtimeStudents.js for realtime subscription
- src/config/env.js for environment handling
- src/config/featureFlags.js for feature flag parsing

## Final Checklist

Use this quick checklist to verify your Supabase and app configuration is correct before running the app.

- Realtime for students table is enabled
  1. In your Supabase project, go to Database → Replication → Realtime.
  2. Ensure Realtime is enabled for the desired scope (entire public schema or explicitly for the students table).
  3. Confirm INSERT, UPDATE, and DELETE events are included for public.students.
  4. If you limit Realtime to specific tables, make sure public.students appears in the enabled tables list.

- Row Level Security (RLS) policies are applied
  1. Open SQL Editor and run the policies from the “Row Level Security (RLS)” section above.
  2. Verify RLS is enabled: alter table public.students enable row level security; is in effect.
  3. For demo usage, anon policies should allow select/insert/update/delete as documented.
  4. For production, replace anon with authenticated and enforce business rules (ownership checks, etc.).

- App feature flag for realtime is set (optional)
  1. In your .env file, set:
     - REACT_APP_FEATURE_FLAGS=realtime
  2. The app uses this flag to subscribe to Supabase Realtime via src/hooks/useRealtimeStudents.js.
  3. To disable live updates, remove realtime from REACT_APP_FEATURE_FLAGS or leave it empty.

- Environment variables are present
  - Required:
    - REACT_APP_SUPABASE_URL
    - REACT_APP_SUPABASE_ANON_KEY
  - Optional:
    - REACT_APP_FEATURE_FLAGS (e.g., realtime)
    - REACT_APP_LOG_LEVEL (error|warn|info|debug)

- Smoke test
  1. Run npm install and npm start.
  2. Create a student in the UI.
  3. In another browser/tab or directly in the Supabase Table Editor, change or insert a record:
     - If REACT_APP_FEATURE_FLAGS includes realtime and Realtime is enabled in Supabase, the list should update without a full refresh.
  4. If you see permission errors, revisit the RLS section above.
