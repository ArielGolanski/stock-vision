import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TrendingStocks from '../components/TrendingStocks';
import StocksDashboard from '../components/StocksDashboard';
import HeaderMenu from '../components/HeaderMenu';
import { API_URL } from '../config';
import { useTheme } from '../components/ThemeContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 200) {
          const data = await res.json();
          console.log(data)
          setUserName(data.firstName || 'User');
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

  return (
    <div
      style={{
        backgroundColor: darkMode ? '#2e2e2eff' : '#f9fafb',
        color: darkMode ? '#e5e5e5' : '#111',
        minHeight: '100vh',
        transition: 'all 0.25s ease',
      }}
    >
      <HeaderMenu />

      {/* Main content + Trending Stocks container */}
      <div style={{ display: 'flex', marginTop: '10px', padding: '0 20px' }}>
        {/* Left side: Main content */}
        <main style={{ flex: 1 }}>
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
