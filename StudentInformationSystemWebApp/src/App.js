import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import StudentsSearchBar from './components/StudentsSearchBar';
import { addStudent, deleteStudent, listStudents, listStudentsFiltered, updateStudent } from './services/studentsService';

import { getSupabaseDiagnostics } from './supabaseClient';

// PUBLIC_INTERFACE
function App() {
  /**
   * Student Information System App
   * - Lists students from Supabase
   * - Allows adding, editing, deleting students
   * - Server-backed pagination and sorting
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

  // Pagination and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Initialize from URL params if present
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const qp = url.searchParams;
      const newFilters = { ...filters };
      ['q','first_name','last_name','email','grade_level','dob_start','dob_end'].forEach((k) => {
        if (qp.has(k)) newFilters[k] = qp.get(k) || '';
      });

      if (qp.has('page')) setPage(Math.max(1, parseInt(qp.get('page') || '1', 10)));
      if (qp.has('pageSize')) setPageSize(Math.min(500, Math.max(1, parseInt(qp.get('pageSize') || '10', 10))));
      if (qp.has('sortBy')) setSortBy(qp.get('sortBy') || 'created_at');
      if (qp.has('sortDir')) setSortDir((qp.get('sortDir') || 'desc') === 'asc' ? 'asc' : 'desc');

      setFilters(newFilters);
    } catch {
      // ignore URL parsing errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state to URL (shallow, no reload)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const qp = url.searchParams;
      // filters
      Object.entries(filters).forEach(([k,v]) => {
        if (v) qp.set(k, v);
        else qp.delete(k);
      });
      // pagination and sort
      qp.set('page', String(page));
      qp.set('pageSize', String(pageSize));
      qp.set('sortBy', sortBy);
      qp.set('sortDir', sortDir);
      const next = `${url.pathname}?${qp.toString()}${url.hash || ''}`;
      window.history.replaceState({}, '', next);
    } catch {
      // ignore
    }
  }, [filters, page, pageSize, sortBy, sortDir]);

  const brand = useMemo(() => ({
    appName: 'Student Information System',
    subtitle: 'Manage student records with Supabase',
  }), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load data whenever filters, pagination, or sorting changes
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await listStudentsFiltered(filters, {
          page,
          pageSize,
          sortBy,
          sortDir,
          withCount: true,
        });
        if (!active) return;
        setStudents(res.data);
        setTotal(res.total);
        // Adjust page if out-of-range after data changes
        if (res.total != null && res.page > 1) {
          const maxPage = Math.max(1, Math.ceil(res.total / res.pageSize));
          if (page > maxPage) setPage(maxPage);
        }
      } catch (e) {
        if (!active) return;
        // If misconfigured Supabase, show the friendly message from service and diagnostics
        const diags = getSupabaseDiagnostics?.();
        const extra = diags && !diags.ok ? ` (${diags.issues.join('; ')})` : '';
        setError((e.message || 'Failed to load students') + extra);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [filters, page, pageSize, sortBy, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

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
        // Optimistically prepend; alternatively, refetch current page
        setStudents((list) => [created, ...list]);
        // If we maintain accurate counts, optionally bump total
        setTotal((t) => (typeof t === 'number' ? t + 1 : t));
      }
      closeForm();
    } catch (e) {
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
      setTotal((t) => (typeof t === 'number' ? Math.max(0, t - 1) : t));
    } catch (e) {
      setError(e.message || 'Delete failed');
      // eslint-disable-next-line no-console
      console.error('[SIS] delete error', e);
    }
  };

  const onChangePageSize = (e) => {
    const next = parseInt(e.target.value || '10', 10);
    setPageSize(next);
    setPage(1); // reset to first page
  };

  const nextPage = () => {
    const maxPage = total != null ? Math.max(1, Math.ceil(total / pageSize)) : page + 1;
    setPage((p) => Math.min(p + 1, maxPage));
  };
  const prevPage = () => setPage((p) => Math.max(1, p - 1));

  const onSortChange = (column) => {
    if (column === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(1);
  };

  const totalPages = total != null ? Math.max(1, Math.ceil((total || 0) / pageSize)) : null;

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
        onChange={(f) => { setFilters(f); setPage(1); }} // reset to first page on filter change
        onSubmit={(f) => { setFilters(f); setPage(1); }}
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

        <div className="card">
          <div className="card-title-row">
            <h3 className="card-title">Students</h3>
            <span className="muted">
              {total != null ? `${total} total` : `${students.length} loaded`}
              {totalPages ? ` • Page ${page} of ${totalPages}` : ''}
            </span>
          </div>

          {loading ? (
            <div className="loading">Loading students…</div>
          ) : (
            <StudentList
              students={students}
              onEdit={openEdit}
              onDelete={onDelete}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            />
          )}

          {/* Pagination controls */}
          <div className="pagination">
            <div className="pagination-left">
              <button className="btn btn-secondary btn-small" onClick={prevPage} disabled={loading || page <= 1}>
                ◀ Prev
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={nextPage}
                disabled={loading || (totalPages ? page >= totalPages : false)}
              >
                Next ▶
              </button>
            </div>
            <div className="pagination-right">
              <label htmlFor="pageSize" className="muted" style={{ marginRight: 8 }}>Rows per page:</label>
              <select id="pageSize" value={pageSize} onChange={onChangePageSize} className="page-size-select" disabled={loading}>
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="muted" style={{ marginLeft: 12 }}>
                {total != null ? `Showing ${(students.length ? (page - 1) * pageSize + 1 : 0)}-${(page - 1) * pageSize + students.length} of ${total}` : ''}
              </span>
            </div>
          </div>
        </div>

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
