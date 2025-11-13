import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * StudentsSearchBar
 * A compact navigation search bar with filters for students listing.
 *
 * Props:
 * - value: current filters state { q, first_name, last_name, email, grade_level, dob_start, dob_end }
 * - onChange: function(nextFilters) -> void (debounced typing will call onChange)
 * - onSubmit: function(finalFilters) -> void (explicit submit or enter)
 * - busy: boolean to indicate when a fetch is ongoing
 *
 * Notes:
 * - Date inputs expect YYYY-MM-DD. This component performs simple client-side validation
 *   and shows a small inline error when format is invalid, but always sends only valid values.
 * - Fields:
 *   - q: free text (applies to first_name, last_name, email via ilike)
 *   - first_name, last_name, email: ilike filters
 *   - grade_level: eq or ilike depending on service implementation (we use eq when exact provided)
 *   - dob_start (>= YYYY-MM-DD), dob_end (<= YYYY-MM-DD)
 */
export default function StudentsSearchBar({ value, onChange, onSubmit, busy }) {
  const [local, setLocal] = useState(value || {});
  const [errors, setErrors] = useState({});
  const firstRun = useRef(true);

  const initial = useMemo(
    () => ({
      q: '',
      first_name: '',
      last_name: '',
      email: '',
      grade_level: '',
      dob_start: '',
      dob_end: '',
      ...value
    }),
    [value]
  );

  useEffect(() => {
    setLocal(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.q, initial.first_name, initial.last_name, initial.email, initial.grade_level, initial.dob_start, initial.dob_end]);

  const setField = (name, val) => {
    setLocal((prev) => ({ ...prev, [name]: val }));
  };

  // Basic YYYY-MM-DD validation
  const validDate = (s) => {
    if (!s) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
  };

  useEffect(() => {
    // Debounce change events after user types
    // Skip on first render to avoid double fetch from page load
    const h = setTimeout(() => {
      if (firstRun.current) {
        firstRun.current = false;
        return;
      }
      const next = normalize(local);
      onChange?.(next);
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.q, local.first_name, local.last_name, local.email, local.grade_level, local.dob_start, local.dob_end]);

  const normalize = (f) => {
    const out = {
      q: (f.q || '').trim(),
      first_name: (f.first_name || '').trim(),
      last_name: (f.last_name || '').trim(),
      email: (f.email || '').trim(),
      grade_level: (f.grade_level || '').trim(),
      dob_start: (f.dob_start || '').trim(),
      dob_end: (f.dob_end || '').trim(),
    };
    // Validate dates
    const e = {};
    if (out.dob_start && !validDate(out.dob_start)) e.dob_start = 'Use YYYY-MM-DD';
    if (out.dob_end && !validDate(out.dob_end)) e.dob_end = 'Use YYYY-MM-DD';

    // Range logic (only if both valid)
    if (!e.dob_start && !e.dob_end && out.dob_start && out.dob_end) {
      if (out.dob_start > out.dob_end) {
        e.dob_end = 'End must be after start';
      }
    }
    setErrors(e);
    // If date errors exist, we still emit change but with invalid date fields dropped
    if (e.dob_start) out.dob_start = '';
    if (e.dob_end) out.dob_end = '';
    return out;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = normalize(local);
    onSubmit?.(payload);
  };

  const clearAll = () => {
    const cleared = {
      q: '',
      first_name: '',
      last_name: '',
      email: '',
      grade_level: '',
      dob_start: '',
      dob_end: '',
    };
    setLocal(cleared);
    onSubmit?.(cleared);
  };

  return (
    <nav className="sis-navbar" role="navigation" aria-label="Students search and actions">
      <div className="container" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="brand" style={{ marginBottom: 8 }}>
          <span className="logo" aria-hidden>🔎</span>
          <div>
            <div className="title">Search Students</div>
            <div className="subtitle">Filter by name, email, grade, or birth date range</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="nav-actions" style={{ width: '100%', flexWrap: 'wrap', gap: 8 }}>
          <input
            aria-label="Search query"
            className="search-input"
            placeholder="Search name or email..."
            value={local.q || ''}
            onChange={(e) => setField('q', e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="First name"
            placeholder="First"
            value={local.first_name || ''}
            onChange={(e) => setField('first_name', e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Last name"
            placeholder="Last"
            value={local.last_name || ''}
            onChange={(e) => setField('last_name', e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Email"
            placeholder="Email"
            value={local.email || ''}
            onChange={(e) => setField('email', e.target.value)}
            style={{ ...inputStyle, minWidth: 200 }}
          />
          <input
            aria-label="Grade level"
            placeholder="Grade"
            value={local.grade_level || ''}
            onChange={(e) => setField('grade_level', e.target.value)}
            style={inputStyle}
          />
          <input
            aria-label="Date of birth start"
            placeholder="DOB start (YYYY-MM-DD)"
            value={local.dob_start || ''}
            onChange={(e) => setField('dob_start', e.target.value)}
            style={{ ...inputStyle, minWidth: 160 }}
          />
          <input
            aria-label="Date of birth end"
            placeholder="DOB end (YYYY-MM-DD)"
            value={local.dob_end || ''}
            onChange={(e) => setField('dob_end', e.target.value)}
            style={{ ...inputStyle, minWidth: 160 }}
          />
          <div className="actions" style={{ gap: 8 }}>
            <button type="submit" className="btn btn-outline" disabled={busy}>
              {busy ? 'Searching…' : 'Search'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearAll} disabled={busy}>
              Clear
            </button>
          </div>
        </form>

        {(errors.dob_start || errors.dob_end) && (
          <div className="error" role="alert" style={{ width: '100%' }}>
            {errors.dob_start || errors.dob_end}
          </div>
        )}
      </div>
    </nav>
  );
}

const inputStyle = {
  border: '1px solid var(--border)',
  background: '#fff',
  color: '#111',
  borderRadius: 8,
  padding: '8px 10px',
  minWidth: 120
};
