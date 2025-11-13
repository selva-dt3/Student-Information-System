# Student Information System (React + Supabase)

A lightweight single-page app to manage students with a responsive, green-themed UI and accessible forms. It uses Supabase as the backend for CRUD.

## Features

- Students list with pagination, search, and inline actions
- Create and edit forms with client-side validation
- Delete with confirmation dialog
- Optional realtime updates gated by feature flag
- Theming with light/dark toggle
- Minimal dependencies

## Quick Start

1) Copy environment template and fill Supabase values:
```
cp .env.example .env
```
Set:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

Optional:
- REACT_APP_FEATURE_FLAGS=realtime (enables live updates via Supabase Realtime for students table)
- REACT_APP_LOG_LEVEL=info (error|warn|info|debug)

2) Install and run:
```
npm install
npm start
```
Open http://localhost:3000

## CRUD Usage

- List: Home route "/" shows students with search box and paging controls
- Create: Click "+ New Student" (or "Add" in navbar), fill First name, Last name, Email, Enrollment date, Status, and optional Age → Save
- Edit: On list, use "Edit" per row to update existing record
- Delete: On list, click "Delete" per row and confirm in the dialog

Expected Supabase table: public.students with fields:
- id (uuid), first_name (text), last_name (text), email (text unique), enrollment_date (date), status (text), age (int), created_at (timestamptz), and a generated name (text) for display

See docs/supabase-setup.md for full SQL.

## Environment Variables

These variables configure the app (Create React App uses the REACT_APP_ prefix):

- REACT_APP_SUPABASE_URL: Supabase Project URL (Settings → API)
- REACT_APP_SUPABASE_ANON_KEY: Supabase anon public key (Settings → API)
- REACT_APP_FEATURE_FLAGS: Comma-separated flags, e.g., "realtime"
- REACT_APP_LOG_LEVEL: Log verbosity for minimal diagnostics (error|warn|info|debug)

Feature flags:
- realtime: Enables live updates via Supabase Realtime for the students table (handled by src/hooks/useRealtimeStudents.js). Remove this flag to disable subscriptions.

## Run, Test, Build

- Development:
  ```
  npm install
  npm start
  ```
  The app will be available at http://localhost:3000.

- Tests:
  ```
  npm test
  ```

- Production build:
  ```
  npm run build
  ```

- Lint:
  ```
  npm run lint
  ```

## Project Structure

- src/App.js: Routes, pages, and UI components (SearchBar, ConfirmDialog, StudentTable, StudentForm)
- src/services/studentService.js: Supabase CRUD operations
- src/lib/supabaseClient.js: Client initialization from env
- src/config/env.js: Environment handling and validation
- src/config/featureFlags.js: Feature flag parsing helpers
- src/hooks/useRealtimeStudents.js: Realtime subscription to public.students
- src/App.css: Green theme styles and responsive components

## Supabase Setup

Follow docs/supabase-setup.md to:
- Create the students table
- Enable RLS and apply demo policies
- Optionally enable Realtime
- Configure environment variables

## Notes

- Ensure your Supabase table "students" exists and fields match the UI and schema described in docs/supabase-setup.md.
- To disable realtime, remove the "realtime" flag from REACT_APP_FEATURE_FLAGS.
