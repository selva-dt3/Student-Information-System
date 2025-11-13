import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Touch env early to emit friendly warnings during startup if missing
import { getEnv } from './config/env';
getEnv();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
