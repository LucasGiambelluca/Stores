import React from 'react';
import ReactDOM from 'react-dom/client';

// Polyfill Buffer for browser compatibility (needed by @gradio/client)
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

import App from './App';
import './index.css';

// Hide initial loading spinner with fade effect
const initialLoader = document.querySelector('.app-loading');
if (initialLoader) {
  initialLoader.classList.add('fade-out');
  setTimeout(() => initialLoader.remove(), 300);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);