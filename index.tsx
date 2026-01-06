import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error('Mounting failed:', err);
    const display = document.getElementById('fatal-error-display');
    if (display) {
      display.style.display = 'block';
      display.textContent = 'Mounting Failed: ' + (err instanceof Error ? err.message : String(err));
    }
  }
}