import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrendingStocks from '../components/TrendingStocks';
import logo from '../assets/logo.png'; // adjust path if needed
import StocksDashboard from '../components/StocksDashboard';
import HeaderMenu from '../components/HeaderMenu';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          const data = await res.json();
          setUserName(data.user.firstName);
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (err) {
        console.log('Error fetching profile:', err);
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <HeaderMenu />
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid #ddd',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Logo" style={{ width: '30px', height: '30px' }} />
          <h1 style={{ margin: 0 }}>StockVision</h1>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '5px 10px', fontSize: '16px' }}
        >
          Logout
        </button>
      </header>

      {/* Main content + Trending Stocks container */}
      <div style={{ display: 'flex', marginTop: '10px', padding: '0 20px' }}>
        {/* Left side: Main content */}
        <main style={{ flex: 1 }}>
          {userName && <h2>Welcome, {userName}!</h2>}
          <StocksDashboard />
        </main>

        {/* Right side: Trending Stocks */}
        <div style={{ width: '320px' }}>
          <TrendingStocks />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
