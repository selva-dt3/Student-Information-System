# Student Information System (React + Supabase)

A lightweight single-page app to manage students with a responsive, green-themed UI and accessible forms. It uses Supabase as the backend for CRUD.

## Features

- Students list with pagination, search, and inline actions
- Create and edit forms with client-side validation
- Delete with confirmation dialog
- Optional realtime placeholder gated by feature flag
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
- REACT_APP_FEATURE_FLAGS=realtime (enables placeholder hook for future live updates)

2) Install and run:
```
npm install
npm start
```
Open http://localhost:3000

## CRUD Usage

- List: Home route "/" shows students with search box and paging controls
- Create: Click "+ New Student" (or "Add" in navbar), fill Name, Email, Age -> Save
- Edit: On list, use "Edit" per row to update existing record
- Delete: On list, click "Delete" per row and confirm in the dialog

Table schema expected in Supabase: students(id, name, email, age, created_at)

## Project Structure

- src/App.js: Routes, pages, and UI components (SearchBar, ConfirmDialog, StudentTable, StudentForm)
- src/services/studentService.js: Supabase CRUD operations
- src/lib/supabaseClient.js: Client initialization from env
- src/config/env.js: Environment handling and validation
- src/App.css: Green theme styles and responsive components

## Scripts

- npm start: Dev server
- npm test: Run tests
- npm run build: Production build
- npm run lint: Basic linting

## Notes

- Ensure your Supabase table "students" exists and fields match the UI.
- For realtime, keep REACT_APP_FEATURE_FLAGS=realtime to allow future subscription integration.
