import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import { addStudent, deleteStudent, listStudents, updateStudent } from './services/studentsService';

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

  const brand = useMemo(() => ({
    appName: 'Student Information System',
    subtitle: 'Manage student records with Supabase',
  }), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
        const updated = await updateStudent(editing.id, vals);
        setStudents((list) => list.map((s) => (s.id === editing.id ? updated : s)));
      } else {
        const created = await addStudent(vals);
        setStudents((list) => [created, ...list]);
      }
      closeForm();
    } catch (e) {
      // If validation errors, component already shows them. Here handle API errors.
      if (!e.validation) {
        setError(e.message || 'Operation failed');
      }
      // eslint-disable-next-line no-console
      console.error('[SIS] submit error', e);
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
