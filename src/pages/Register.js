import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useTheme } from '../components/ThemeContext'; // ייבוא useTheme

const Register = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme(); // שימוש ב-useTheme

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
  const [loading, setLoading] = useState(false); // הוספת מצב טעינה
  
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const formGradient = "linear-gradient(90deg, #e5d88dff 0%, #22C1C3 100%)";
  
  const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    width: '100%',
    marginBottom: '10px',
    boxSizing: 'border-box',
    color: '#111',
    background: '#fff',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#111', 
  };
  
  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    width: '100%',
    background: loading ? '#aaa' : '#1A237E', // כפתור כחול כהה
    color: '#fff',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '10px',
  };

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
    setLoading(true);

    if (!validateEmail(email)) { setLoading(false); return setError('Invalid email format'); }
    if (!validatePassword(password)) { 
      setLoading(false); 
      return setError('Password must be at least 8 characters and include uppercase, lowercase, and a number'); 
    }
    if (password !== repeatPassword) { setLoading(false); return setError('Passwords do not match'); }
    if (!selectedBrokerage) { setLoading(false); return setError('Please select a brokerage'); }

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, brokerage: selectedBrokerage, customFeePerShare, customFeeMinimum }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsVerificationStep(true);
        // Note: Switched from alert() to console/in-app message per guidelines
        console.log('Check your email for the verification code'); 
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Verify Email ----------
  const handleVerifyCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        // Note: Switched from alert() to console/in-app message per guidelines
        console.log('Email verified! You can now log in.');
        navigate('/login');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        background: darkMode ? '#121212' : '#f4f4f9', 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '20px 0' 
      }}
    >
      <div 
        style={{ 
          padding: '30px',
          borderRadius: '12px',
          background: formGradient, 
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          maxWidth: '450px',
          width: '90%',
          textAlign: 'center',
          color: '#111',
        }}
      >
        <h2 style={{ marginBottom: '25px', color: '#111', fontSize: '28px' }}>Register Account</h2>

        {error && <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '15px' }}>{error}</div>}
        
        {!isVerificationStep ? (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              
              {/* First Name */}
              <div>
                <label htmlFor="firstName" style={labelStyle}>First Name</label>
                <input
                  type="text"
                  id="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
              </div>
            </div>

            {/* Brokerage Selection */}
            <div style={{ margin: '15px 0' }}>
              <label htmlFor="brokerage" style={labelStyle}>Trading Brokerage</label>
              <select
                id="brokerage"
                value={selectedBrokerage}
                onChange={(e) => setSelectedBrokerage(e.target.value)}
                required
                style={{ ...inputStyle, width: '100%', marginBottom: 0 }}
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
            
            {/* Custom Fees */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              
              {/* Fee Per Share */}
              <div>
                <label htmlFor="feePerShare" style={labelStyle}>Fee per Share (USD)</label>
                <input
                  type="number"
                  id="feePerShare"
                  step="0.0001"
                  placeholder="e.g., 0.005"
                  value={customFeePerShare}
                  onChange={(e) => setCustomFeePerShare(parseFloat(e.target.value) || 0)}
                  required
                  style={{ ...inputStyle, width: '100%' }}
                />
                <p style={{ fontSize: '11px', color: '#333' }}>Buying & Selling Fee</p>
              </div>

              {/* Minimum Fee */}
              <div>
                <label htmlFor="minFee" style={labelStyle}>Minimum Fee (USD)</label>
                <input
                  type="number"
                  id="minFee"
                  step="0.01"
                  placeholder="e.g., 1.99"
                  value={customFeeMinimum}
                  onChange={(e) => setCustomFeeMinimum(parseFloat(e.target.value) || 0)}
                  required
                  style={{ ...inputStyle, width: '100%' }}
                />
                <p style={{ fontSize: '11px', color: '#333' }}>Min. Fee per Command</p>
              </div>
            </div>
            
            {/* Email */}
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                type="email"
                id="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Passwords */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, width: '100%', marginBottom: 0 }}
                  />
                  <button type="button" onClick={() => handleShowPassword(setShowPassword)} style={{ marginLeft: '5px', background: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                    👁
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label htmlFor="repeatPassword" style={labelStyle}>Repeat Password</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showRepeatPassword ? 'text' : 'password'}
                    id="repeatPassword"
                    placeholder="Repeat Password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, width: '100%', marginBottom: 0 }}
                  />
                  <button type="button" onClick={() => handleShowPassword(setShowRepeatPassword)} style={{ marginLeft: '5px', background: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                    👁
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          /* שלב האימות */
          <div style={{ padding: '20px 0' }}>
            <p style={{ color: '#111', fontSize: '16px' }}>Enter the verification code sent to **{email}**</p>
            <input
              type="text"
              placeholder="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              style={{ ...inputStyle, width: '200px' }}
            />
            <button onClick={handleVerifyCode} disabled={loading} style={{ ...buttonStyle, width: 'auto', padding: '10px 30px' }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '15px', color: '#333' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#1A237E', fontWeight: 'bold', textDecoration: 'none' }}>Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;