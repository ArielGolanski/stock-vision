import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

  const handleShowPassword = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1000);
  };

  // ---------- Register ----------
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) return setError('Invalid email format');
    if (!validatePassword(password))
      return setError('Password must be at least 8 characters and include uppercase, lowercase, and a number');
    if (password !== repeatPassword) return setError('Passwords do not match');

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsVerificationStep(true);
        alert('Check your email for the verification code');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  // ---------- Verify Email ----------
  const handleVerifyCode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Email verified! You can now log in.');
        navigate('/login');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Register</h2>

      {!isVerificationStep ? (
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

          <div style={{ marginTop: '5px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '10px', width: '120px' }}
            />
            <button type="button" onClick={() => handleShowPassword(setShowPassword)} style={{ marginLeft: '5px' }}>
              👁
            </button>
          </div>

          <div style={{ marginTop: '5px' }}>
            <input
              type={showRepeatPassword ? 'text' : 'password'}
              placeholder="Repeat Password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
              style={{ padding: '10px', width: '120px' }}
            />
            <button type="button" onClick={() => handleShowPassword(setShowRepeatPassword)} style={{ marginLeft: '5px' }}>
              👁
            </button>
          </div>

          <div>
            <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>
              Register
            </button>
          </div>
        </form>
      ) : (
        <div>
          <p>Enter the verification code sent to {email}</p>
          <input
            type="text"
            placeholder="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            style={{ padding: '10px', margin: '5px', width: '150px' }}
          />
          <button onClick={handleVerifyCode} style={{ padding: '10px 20px', marginTop: '10px' }}>
            Verify Email
          </button>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default Register;
