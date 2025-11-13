import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Render App directly without routing for the previous single-page behavior
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
