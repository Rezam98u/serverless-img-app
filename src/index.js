import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ correct import for createRoot
import './index.css';
import App from './App';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

// ✅ Use createRoot instead of render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
