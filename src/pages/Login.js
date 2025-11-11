import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useTheme } from '../components/ThemeContext'; // ייבוא useTheme

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // שימוש ב-useTheme

  const formGradient = "linear-gradient(90deg, #e5d88dff 0%, #22C1C3 100%)";

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.email);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => navigate('/register');

  const inputStyle = {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    width: '100%',
    marginBottom: '15px',
    boxSizing: 'border-box',
    color: '#111', 
    background: '#fff',
  };

  const buttonStyle = {
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    width: '100%',
    background: loading ? '#aaa' : '#1A237E', 
    color: '#fff',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginBottom: '15px',
  };

  return (
    <div 
      style={{ 
        background: darkMode ? '#121212' : '#f4f4f9', 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      <div 
        style={{ 
          padding: '40px',
          borderRadius: '12px',
          background: formGradient, 
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          maxWidth: '380px',
          width: '90%',
          textAlign: 'center',
          color: '#111', 
        }}
      >
        <h2 style={{ marginBottom: '25px', color: '#111', fontSize: '28px' }}>Sign In</h2>
        
        <form onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {error && <p style={{ color: '#dc2626', fontWeight: 'bold' }}>{error}</p>}
        
        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Don't have an account?{' '}
          <button 
            onClick={goToRegister} 
            style={{ 
              background: 'none', 
              color: '#1A237E', // כחול כהה שיתאים לכפתור
              padding: 0, 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;