import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import '../index.css';
import StudentsSearchBar from '../components/StudentsSearchBar';
import StudentList from '../components/StudentList';
import { listStudentsFiltered, deleteStudent, updateStudent, addStudent } from '../services/studentsService';
import StudentForm from '../components/StudentForm';
import { getSupabaseDiagnostics } from '../supabaseClient';

// PUBLIC_INTERFACE
export default function SearchStudentsPage() {
  /**
   * SearchStudentsPage
   * Dedicated page for searching students with full details.
   * - Reuses listStudentsFiltered service
   * - Debounced filtering via StudentsSearchBar
   * - Server-backed pagination and sorting
   * - Shows full student details including address, phone, created_at
   */
  const [theme, setTheme] = useState('light');
  const [filters, setFilters] = useState({
    q: '',
    first_name: '',
    last_name: '',
    email: '',
    grade_level: '',
    dob_start: '',
    dob_end: '',
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const brand = useMemo(() => ({
    appName: 'Student Information System',
    subtitle: 'Search and manage students',
  }), []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize from URL
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
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to URL
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const qp = url.searchParams;
      Object.entries(filters).forEach(([k,v]) => {
        if (v) qp.set(k, v); else qp.delete(k);
      });
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

  // Load data
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
        if (res.total != null && res.page > 1) {
          const maxPage = Math.max(1, Math.ceil(res.total / res.pageSize));
          if (page > maxPage) setPage(maxPage);
        }
      } catch (e) {
        if (!active) return;
        const diags = getSupabaseDiagnostics?.();
        const extra = diags && !diags.ok ? ` (${diags.issues.join('; ')})` : '';
        setError((e.message || 'Failed to load students') + extra);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSize, sortBy, sortDir]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const openAdd = () => { setEditing(null); setShowForm(true); setError(''); };
  const openEdit = (s) => { setEditing(s); setShowForm(true); setError(''); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const onSubmitForm = async (vals) => {
    try {
      if (editing) {
        const updated = await updateStudent(editing.id, vals);
        setStudents((list) => list.map((s) => (s.id === editing.id ? updated : s)));
      } else {
        const created = await addStudent(vals);
        setStudents((list) => [created, ...list]);
        setTotal((t) => (typeof t === 'number' ? t + 1 : t));
      }
      closeForm();
    } catch (e) {
      if (!e.validation) setError(e.message || 'Operation failed');
      // eslint-disable-next-line no-console
      console.error('[SIS] submit error', e);
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
    }
  };

  const onChangePageSize = (e) => {
    const next = parseInt(e.target.value || '10', 10);
    setPageSize(next);
    setPage(1);
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
            <a className="btn btn-secondary" href="/">🏠 Home</a>
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
        onChange={(f) => { setFilters(f); setPage(1); }}
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
            <h3 className="card-title">Search Results</h3>
            <span className="muted">
              {total != null ? `${total} total` : `${students.length} loaded`}
              {totalPages ? ` • Page ${page} of ${totalPages}` : ''}
            </span>
          </div>

          {loading ? (
            <div className="loading">Loading students…</div>
          ) : (
            <>
              {/* Full-detail view beneath the table header via extra columns/section */}
              <StudentList
                students={students}
                onEdit={openEdit}
                onDelete={onDelete}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={onSortChange}
              />
              {/* Additional details list visual (address, phone, updated_at) */}
              <div className="card" style={{ marginTop: 12 }}>
                <h4 className="card-title">Details</h4>
                {students.length === 0 ? (
                  <div className="muted">No results to display.</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {students.map((s) => (
                      <li key={`detail-${s.id}`} style={{ marginBottom: 8 }}>
                        <strong>{s.first_name} {s.last_name}</strong> — {s.email}
                        {s.date_of_birth ? ` • DOB: ${s.date_of_birth}` : ''}
                        {s.grade_level ? ` • Grade: ${s.grade_level}` : ''}
                        {s.address ? ` • Address: ${s.address}` : ''}
                        {s.phone ? ` • Phone: ${s.phone}` : ''}
                        {s.created_at ? ` • Created: ${new Date(s.created_at).toLocaleString()}` : ''}
                        {s.updated_at ? ` • Updated: ${new Date(s.updated_at).toLocaleString()}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
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
