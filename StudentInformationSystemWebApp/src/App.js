import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Route pages
import StudentsList from './routes/StudentsList';
import StudentCreate from './routes/StudentCreate';
import StudentEdit from './routes/StudentEdit';

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
            <Route path="/" element={<StudentsList />} />
            <Route path="/students/new" element={<StudentCreate />} />
            <Route path="/students/:id/edit" element={<StudentEdit />} />
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
