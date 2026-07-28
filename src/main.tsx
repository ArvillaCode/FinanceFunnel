import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for Native App experience
const registerSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('PWA ServiceWorker activo:', reg.scope))
      .catch((err) => console.warn('PWA ServiceWorker fallo:', err));
  }
};

if (document.readyState === 'complete') {
  registerSW();
} else {
  window.addEventListener('load', registerSW);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
