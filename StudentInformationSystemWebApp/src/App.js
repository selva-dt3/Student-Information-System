import React, { useMemo, useState, useEffect } from 'react';
import './App.css';
import './index.css';

// PUBLIC_INTERFACE
function App() {
  /**
   * Single-page home app (pre-routing version)
   * - Simple header with theme toggle
   * - Basic welcome card
   */
  const [theme, setTheme] = useState('light');
  const brand = useMemo(
    () => ({
      appName: 'Student Information System',
      subtitle: 'Manage student records with Supabase',
    }),
    []
  );
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
          </div>
        </div>
      </header>

      <main className="container">
        <div className="card">
          <h3 className="card-title">Welcome</h3>
          <p>
            This is the Student Information System demo application.
          </p>
          <p className="muted">
            Use the app to add, edit, and manage student records with Supabase.
          </p>
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
