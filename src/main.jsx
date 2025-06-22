import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App.jsx'; // Make sure path points to your main App file
import './index.css'; // Your TailwindCSS entry point

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)
