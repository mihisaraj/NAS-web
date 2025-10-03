import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

if (typeof window !== 'undefined') {
  const apiUrl =
    (typeof window.__HTS_API_URL__ === 'string' && window.__HTS_API_URL__)
      ? window.__HTS_API_URL__
      : import.meta.env.VITE_API_URL;
  if (apiUrl) {
    window.__HTS_API_URL__ = apiUrl.replace(/\/$/, '');
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
