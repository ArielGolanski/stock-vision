import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5001/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log(data)
      if (res.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.email);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const res = await fetch('http://localhost:5001/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userName', data.user.firstName);
        navigate('/');
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  const goToRegister = () => navigate('/register');

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>

      <div style={{ marginTop: '20px' }}>
        {/* <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => setError('Google login failed')} */}
        {/* /> */}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>
        Don't have an account?{' '}
        <button onClick={goToRegister} style={{ background: 'none', color: 'blue', padding: 0 }}>
          Register
        </button>
      </p>
    </div>
  );
};

export default Login;
