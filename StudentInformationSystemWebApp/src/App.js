import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import StudentsSearchBar from './components/StudentsSearchBar';
import { addStudent, deleteStudent, listStudents, listStudentsFiltered, updateStudent } from './services/studentsService';

// PUBLIC_INTERFACE
function App() {
  /**
   * Student Information System App
   * - Lists students from Supabase
   * - Allows adding, editing, deleting students
   * - Client-side validation and basic logging
   * - Responsive green-themed UI with light/dark toggle
   */
  const [theme, setTheme] = useState('light');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    first_name: '',
    last_name: '',
    email: '',
    grade_level: '',
    dob_start: '',
    dob_end: '',
  });

  const brand = useMemo(() => ({
    appName: 'Student Information System',
    subtitle: 'Manage student records with Supabase',
  }), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial load (unfiltered)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await listStudents();
        if (mounted) setStudents(data);
      } catch (e) {
        setError('Could not load students. Check Supabase configuration.');
        // eslint-disable-next-line no-console
        console.error('[SIS] listStudents error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Trigger filtered search when filters change (from search bar)
  useEffect(() => {
    let active = true;
    const fetchFiltered = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await listStudentsFiltered(filters, { page: 1, pageSize: 100 });
        if (!active) return;
        setStudents(res.data);
      } catch (e) {
        if (!active) return;
        setError(e.message || 'Search failed');
      } finally {
        if (active) setLoading(false);
      }
    };

    // If all filters are empty, fall back to full list
    const allEmpty = Object.values(filters).every((v) => !v);
    if (allEmpty) {
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          const data = await listStudents();
          if (mounted && active) setStudents(data);
        } catch (e) {
          if (mounted && active) {
            setError('Could not load students. Check Supabase configuration.');
            // eslint-disable-next-line no-console
            console.error('[SIS] listStudents error', e);
          }
        } finally {
          if (mounted && active) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    } else {
      fetchFiltered();
      return () => { active = false; };
    }
  }, [filters]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
    setError('');
  };
  const openEdit = (s) => {
    setEditing(s);
    setShowForm(true);
    setError('');
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const onSubmitForm = async (vals) => {
    try {
      if (editing) {
        // Safe logging of keys to ensure no legacy 'dob' leaks into update payload
        // eslint-disable-next-line no-console
        console.info('[SIS] ui.update_payload_keys_preview', { keys: Object.keys(vals || {}).sort() });
        const updated = await updateStudent(editing.id, vals);
        setStudents((list) => list.map((s) => (s.id === editing.id ? updated : s)));
      } else {
        // eslint-disable-next-line no-console
        console.info('[SIS] ui.add_payload_keys_preview', { keys: Object.keys(vals || {}).sort() });
        const created = await addStudent(vals);
        setStudents((list) => [created, ...list]);
      }
      closeForm();
    } catch (e) {
      // If validation errors, component already shows them. Here handle API errors.
      if (!e.validation) {
        const friendly = e.message || 'Operation failed';
        setError(friendly);
      }
      // eslint-disable-next-line no-console
      console.error('[SIS] submit error', { message: e?.message, details: e?.details });
    }
  };

  const onDelete = async (s) => {
    if (!window.confirm(`Delete ${s.first_name} ${s.last_name}?`)) return;
    try {
      await deleteStudent(s.id);
      setStudents((list) => list.filter((i) => i.id !== s.id));
    } catch (e) {
      setError(e.message || 'Delete failed');
      // eslint-disable-next-line no-console
      console.error('[SIS] delete error', e);
    }
  };

  return (
    <div className="App">
      <header className="sis-navbar">
        <div className="container">
          <div className="brand">
            <span className="logo" aria-hidden>🎓</span>
            <div>
              <div className="title">{brand.appName}</div>
              <div className="subtitle">{brand.subtitle}</div>
            </div>
          </div>
          <div className="nav-actions">
            <button
              className="btn btn-outline"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>
          </div>
        </div>
      </header>

      {/* Search and filter bar */}
      <StudentsSearchBar
        value={filters}
        onChange={(f) => setFilters(f)}
        onSubmit={(f) => setFilters(f)}
        busy={loading}
      />

      <main className="container">
        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {showForm && (
          <StudentForm
            initial={editing}
            onCancel={closeForm}
            onSubmit={onSubmitForm}
          />
        )}

        {loading ? (
          <div className="card">
            <div className="loading">Loading students…</div>
          </div>
        ) : (
          <StudentList students={students} onEdit={openEdit} onDelete={onDelete} />
        )}

        <footer className="footer">
          <span className="muted">
            Environment: {process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development'} • Port: 3000
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
