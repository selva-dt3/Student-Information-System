import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { getEnv } from './config/env';
import { listStudents, deleteStudent, getStudentById, createStudent, updateStudent } from './services/studentService';

/**
 * Small utility to read feature flags
 */
// PUBLIC_INTERFACE
function useFeatureFlag(flagName) {
  /** Returns whether a given feature flag is enabled via REACT_APP_FEATURE_FLAGS */
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const { FEATURE_FLAGS } = getEnv();
    setEnabled(FEATURE_FLAGS.includes(flagName));
  }, []);
  return enabled;
}

/**
 * SearchBar component for simple client-side filtering and search input management
 */
// PUBLIC_INTERFACE
function SearchBar({ value, onChange, placeholder = "Search students..." }) {
  /** SearchBar input for filtering list */
  return (
    <div className="sis-searchbar" style={{ width: 'min(380px, 100%)' }}>
      <input
        className="sis-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search students"
      />
    </div>
  );
}

/**
 * ConfirmDialog for delete confirmations
 */
// PUBLIC_INTERFACE
function ConfirmDialog({ open, title = "Confirm", message, onConfirm, onCancel }) {
  /** Accessible confirm dialog for destructive actions */
  if (!open) return null;
  return (
    <div className="sis-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="sis-modal">
        <h3 id="confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="sis-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/**
 * StudentTable shows basic table with pagination and inline actions
 */
// PUBLIC_INTERFACE
function StudentTable({ items, page, pageSize, total, onPageChange, onEdit, onDelete }) {
  /** Table for listing students with pagination controls */
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return (
    <div className="sis-card" role="region" aria-label="Students table">
      <div className="sis-table-responsive">
        <table className="sis-table">
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>Name</th>
              <th style={{textAlign:'left'}}>Email</th>
              <th>Age</th>
              <th style={{width: 180}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>
                  No students found.
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td style={{textAlign:'center'}}>{s.age}</td>
                <td>
                  <div className="sis-table-actions">
                    <button className="btn btn-secondary" onClick={() => onEdit(s.id)} aria-label={`Edit ${s.name}`}>Edit</button>
                    <button className="btn btn-danger" onClick={() => onDelete(s.id)} aria-label={`Delete ${s.name}`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sis-pagination" aria-label="Pagination">
        <button className="btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</button>
        <span className="sis-page-indicator">Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

/**
 * StudentForm for create and edit actions
 */
// PUBLIC_INTERFACE
function StudentForm({ initialValues = { name: '', email: '', age: '' }, onSubmit, submitting }) {
  /** Basic controlled form with simple validations */
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => setForm(initialValues), [initialValues]);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required';
    if (!form.email?.trim()) e.email = 'Email is required';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.age === '' || form.age === null || form.age === undefined) e.age = 'Age is required';
    else if (Number.isNaN(Number(form.age))) e.age = 'Age must be a number';
    else if (Number(form.age) < 0) e.age = 'Age must be positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'age' ? value.replace(/[^\d]/g, '') : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, age: Number(form.age) });
  };

  return (
    <form className="sis-form" onSubmit={handleSubmit} noValidate aria-label="Student form">
      <div className="sis-form-row">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" className="sis-input" value={form.name} onChange={handleChange} required aria-invalid={!!errors.name} />
        {errors.name && <div className="sis-error" role="alert">{errors.name}</div>}
      </div>
      <div className="sis-form-row">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" className="sis-input" value={form.email} onChange={handleChange} required aria-invalid={!!errors.email} />
        {errors.email && <div className="sis-error" role="alert">{errors.email}</div>}
      </div>
      <div className="sis-form-row">
        <label htmlFor="age">Age</label>
        <input id="age" name="age" className="sis-input" value={form.age} onChange={handleChange} inputMode="numeric" required aria-invalid={!!errors.age} />
        {errors.age && <div className="sis-error" role="alert">{errors.age}</div>}
      </div>
      <div className="sis-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

/**
 * Hooks to fetch students (basic + placeholder realtime)
 */
// PUBLIC_INTERFACE
function useStudents({ page, pageSize, search }) {
  /** Fetch students with pagination and optional search filter (client-side for now) */
  const [state, setState] = useState({ items: [], total: 0, loading: false, error: null });

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const offset = (page - 1) * pageSize;
        const { data, count } = await listStudents({ limit: pageSize, offset, orderBy: 'created_at', ascending: false });
        const filtered = search
          ? (data || []).filter((d) => {
              const q = search.toLowerCase();
              return (
                String(d.name || '').toLowerCase().includes(q) ||
                String(d.email || '').toLowerCase().includes(q)
              );
            })
          : data || [];
        if (!cancelled) setState({ items: filtered, total: count || filtered.length, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setState({ items: [], total: 0, loading: false, error: err });
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [page, pageSize, search]);

  return state;
}

// PUBLIC_INTERFACE
function useRealtimeStudents(enabledFlag = false) {
  /** Placeholder: if feature flag enabled, could subscribe to realtime changes */
  const enabled = useFeatureFlag('realtime') && enabledFlag;
  useEffect(() => {
    if (!enabled) return;
    // Future: set up Supabase channel subscription for "students" changes
    // Return cleanup to unsubscribe
    return () => {};
  }, [enabled]);
}

/**
 * Pages
 */
function StudentsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const { items, total, loading, error } = useStudents({ page, pageSize, search });
  useRealtimeStudents();

  const handleEdit = (id) => navigate(`/students/${id}/edit`);
  const handleDeleteAsk = (id) => setConfirmId(id);
  const handleConfirmClose = () => setConfirmId(null);
  const handleConfirmDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteStudent(confirmId);
      setConfirmId(null);
      // trigger refetch by tweaking state
      setPage(1);
      setSearch(s => s + '');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Delete failed: ${err.message}`);
      setConfirmId(null);
    }
  };

  return (
    <div className="sis-container">
      <div className="sis-header">
        <h2 className="sis-title">Students</h2>
        <div className="sis-header-actions">
          <SearchBar value={search} onChange={setSearch} />
          <button className="btn btn-primary" onClick={() => navigate('/students/new')}>+ New Student</button>
        </div>
      </div>

      {loading && <div className="sis-info">Loading...</div>}
      {error && <div className="sis-error">Error: {error.message}</div>}

      <StudentTable
        items={items}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDeleteAsk}
      />

      <ConfirmDialog
        open={!!confirmId}
        title="Confirm delete"
        message="Are you sure you want to delete this student? This action cannot be undone."
        onCancel={handleConfirmClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function StudentNewPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createStudent(payload);
      navigate('/');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Create failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sis-container">
      <h2 className="sis-title">New Student</h2>
      <StudentForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

function StudentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const s = await getStudentById(id);
        if (!cancelled) {
          setInitial({ name: s.name || '', email: s.email || '', age: s.age ?? '' });
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = async (updates) => {
    setSubmitting(true);
    try {
      await updateStudent(id, updates);
      navigate('/');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Update failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="sis-container"><div className="sis-info">Loading...</div></div>;
  if (error) return <div className="sis-container"><div className="sis-error">Error: {error.message}</div></div>;
  if (!initial) return <div className="sis-container"><div className="sis-error">Student not found</div></div>;

  return (
    <div className="sis-container">
      <h2 className="sis-title">Edit Student</h2>
      <StudentForm initialValues={initial} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

/**
 * App shell with theme toggle and navigation
 */
// PUBLIC_INTERFACE
function AppShell() {
  /** Router shell with simple navbar and theme toggle */
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="App">
        <nav className="sis-navbar">
          <div className="sis-nav-inner">
            <Link className="sis-brand" to="/">SIS</Link>
            <div className="sis-nav-actions">
              <Link className="btn btn-link" to="/">Home</Link>
              <Link className="btn btn-link" to="/students/new">Add</Link>
              <button
                className="theme-toggle"
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>
        </nav>

        <main className="sis-main">
          <Routes>
            <Route path="/" element={<StudentsListPage />} />
            <Route path="/students/new" element={<StudentNewPage />} />
            <Route path="/students/:id/edit" element={<StudentEditPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Entry point exports AppShell for CRA root */
  return <AppShell />;
}

export default App;
