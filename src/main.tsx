import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress annoying Sandbox and cross-origin iframe Script errors/SecurityErrors
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    const msg = String(message || '');
    // Swallowing all generic "Script error." and cross-origin issues from Telegram or sandbox environment
    if (
      msg.includes('Script error') ||
      msg.includes('SecurityError') ||
      msg.includes('cross-origin') ||
      msg.includes('parent') ||
      msg.includes('Telegram')
    ) {
      return true; // Prevents the firing of the default event handler
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = reason.message || '';
      const name = reason.name || '';
      if (
        msg === 'Script error.' ||
        name === 'SecurityError' ||
        msg.includes('SecurityError') ||
        msg.includes('cross-origin') ||
        msg.includes('parent') ||
        msg.includes('Telegram')
      ) {
        event.preventDefault();
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

