import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from "./components/ThemeContext";
import './styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId="973001477575-cenqtr56g4vmblenjkt3olcpu21mp3c2.apps.googleusercontent.com"></GoogleOAuthProvider>
      <App />
      <GoogleOAuthProvider clientId="973001477575-cenqtr56g4vmblenjkt3olcpu21mp3c2.apps.googleusercontent.com"></GoogleOAuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
