import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [brokerages, setBrokerages] = useState([]);
  const [selectedBrokerage, setSelectedBrokerage] = useState('');
  const [customFeePerShare, setCustomFeePerShare] = useState(0.00);
  const [customFeeMinimum, setCustomFeeMinimum] = useState(0.00);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  useEffect(() => {
    const fetchBrokerages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/brokerages`);
        const data = await res.json();
        
        if (res.ok) {
          setBrokerages(data);
          if (data.length > 0) {
            setSelectedBrokerage(data[0]._id); 
          }
        } else {
          console.error('Failed to fetch brokerages:', data.message);
        }
      } catch (err) {
        console.error('Error connecting to brokerage API:', err);
      }
    };

    fetchBrokerages();
  }, []);

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
    if (!selectedBrokerage) return setError('Please select a brokerage');

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, brokerage: selectedBrokerage, customFeePerShare, customFeeMinimum }),
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
          <div style={{ margin: '5px' }}>
            <select
              value={selectedBrokerage}
              onChange={(e) => setSelectedBrokerage(e.target.value)}
              required
              style={{ padding: '10px', width: '200px' }}
              disabled={brokerages.length === 0}
            >
              {brokerages.length > 0 ? (
                brokerages.map((brokerage) => (
                  <option key={brokerage._id} value={brokerage._id}>
                    {brokerage.name}
                  </option>
                ))
              ) : (
                <option value="">Loading brokerages...</option>
              )}
            </select>
          </div>
          <div style={{ margin: '5px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                Buying and Selling Fee per Share (in usd$)
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g., 0.005"
                  value={customFeePerShare}
                  onChange={(e) => setCustomFeePerShare(parseFloat(e.target.value) || 0)}
                  required
                  style={{ padding: '10px', margin: '5px', width: '200px' }}
                />
            </label>
          </div>
          <div style={{ margin: '5px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                Minimun Fee per Buying/Selling Command
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1.99"
                  value={customFeeMinimum}
                  onChange={(e) => setCustomFeeMinimum(parseFloat(e.target.value) || 0)}
                  required
                  style={{ padding: '10px', margin: '5px', width: '200px' }}
                />
            </label>
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
