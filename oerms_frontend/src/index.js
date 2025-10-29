import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your main application component

// Use React 18's createRoot to render the application into the DOM element with ID 'root'
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Note: This file serves as the universal entry point for the React application.