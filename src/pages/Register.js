import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/'); // go to dashboard
  }, [navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

  const handleShowPassword = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1000); // show for 1 second
  };

  // --- Regular form registration ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) return setError('Invalid email format');
    if (!validatePassword(password))
      return setError(
        'Password must be at least 8 characters and contain uppercase, lowercase, and a number'
      );
    if (password !== repeatPassword) return setError('Passwords do not match');

    try {
      const res = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();
      if (res.status === 201) navigate('/login');
      else setError(data.message || 'Registration failed');
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  // --- Google login / register ---
  const handleGoogleRegister = async (credentialResponse) => {
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
        localStorage.setItem('userName', data.firstName);
        navigate('/');
      } else {
        setError(data.message || 'Google registration failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <div>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={{ padding: '10px', margin: '5px' }}
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={{ padding: '10px', margin: '5px' }}
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px', margin: '5px' }}
          />
        </div>

        {/* Password Input */}
        <div style={{ textAlign: 'center', marginTop: '5px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px', width: '120px' }}
          />
          <button
            type="button"
            onClick={() => handleShowPassword(setShowPassword)}
            style={{ marginLeft: '5px', padding: '5px 10px', cursor: 'pointer' }}
          >
            👁
          </button>
        </div>

        {/* Repeat Password Input */}
        <div style={{ textAlign: 'center', marginTop: '5px' }}>
          <input
            type={showRepeatPassword ? 'text' : 'password'}
            placeholder="Repeat Password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            required
            style={{ padding: '10px', width: '120px' }}
          />
          <button
            type="button"
            onClick={() => handleShowPassword(setShowRepeatPassword)}
            style={{ marginLeft: '5px', padding: '5px 10px', cursor: 'pointer' }}
          >
            👁
          </button>
        </div>

        <div>
          <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>
            Register
          </button>
        </div>
      </form>

      {/* --- Google Register Button --- */}
      <div style={{ marginTop: '20px' }}>
        <GoogleLogin
          onSuccess={handleGoogleRegister}
          onError={() => setError('Google registration failed')}
        />
      </div>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default Register;
