/**
 * Ojasvita - Main Entry Point
 * 
 * This is the main entry point for the React application.
 * It renders the App component into the root element.
 * 
 * Dependencies:
 * - react: Core React library
 * - react-dom: React DOM rendering
 * - react-router-dom: Routing for single-page app
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root element from index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component
// StrictMode helps catch potential problems during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
