import React, { useEffect, useState } from 'react';
import { useTheme } from "./ThemeContext";
import { API_URL } from "../config";

const TrendingStocks = () => {
  const { darkMode } = useTheme();

  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/stocks/trending`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setGainers(data.gainers || []);
      setLosers(data.losers || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStocks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStockLogo = (symbol) => {
    try {
      return require(`../assets/${symbol.toLowerCase()}.png`);
    } catch (error) {
      console.warn(`Logo not found for ${symbol}`);
      return null;
    }
  };

  const renderStockItem = (stock, isGainer) => (
    <div
      key={stock.symbol}
      className="stock-item"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        margin: '6px 0',
        borderRadius: '8px',
        backgroundColor: darkMode ? '#000000' : isGainer ? '#f0f9ff' : '#fef2f2',
        border: `1px solid ${isGainer ? '#bfdbfe' : '#fecaca'}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: darkMode ? '#000000' : '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          {getStockLogo(stock.symbol) ? (
            <img
              src={getStockLogo(stock.symbol)}
              alt={`${stock.symbol} logo`}
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
          ) : (
            <div style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {stock.symbol.slice(0, 2)}
            </div>
          )}
          <div style={{
            display: 'none',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            {stock.symbol.slice(0, 2)}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {stock.symbol}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {formatPrice(stock.price)}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            color: isGainer ? '#059669' : '#dc2626',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {stock.percentChange > 0 ? '+' : ''}
          {stock.percentChange.toFixed(2)}%
        </div>
        <div
          style={{
            fontSize: '12px',
            color: isGainer ? '#059669' : '#dc2626',
          }}
        >
          {stock.change > 0 ? '+' : ''}
          {formatPrice(stock.change)}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>
          Loading trending stocks...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#dc2626', marginBottom: '10px' }}>
          Error: {error}
        </div>
        <button
          onClick={fetchStocks}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        width: '100%',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        color: darkMode ? '#f1f1f1' : '#111',
        borderRadius: '8px',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ margin: 0 }}>Trending Stocks</h2>
        <div style={{ fontSize: '12px' }}>
          Last updated: {lastUpdated}
          <button
            onClick={fetchStocks}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: darkMode ? '#333' : '#f3f4f6',
              border: darkMode ? '1px solid #555' : '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              color: darkMode ? '#f1f1f1' : '#111',
            }}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Vertical stack instead of grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Top Gainers */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: darkMode ? '#111827' : '#ffffff' }}>
          <h3 style={{
            color: '#059669',
            backgroundColor: darkMode ? '#2e2e2eff' : '#d1fae5',
            borderBottom: '2px solid #059669',
            paddingBottom: '8px',
            marginBottom: '16px'
          }}>
            📈 Top Gainers
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {gainers.length > 0 ? (
              gainers.map(stock => renderStockItem(stock, true))
            ) : (
              <p style={{ color: '#666', textAlign: 'center' }}>
                No gainers data available
              </p>
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: darkMode ? '#111827' : '#ffffff' }}>
          <h3 style={{
            color: '#dc2626',
            borderBottom: '2px solid #dc2626',
            paddingBottom: '8px',
            marginBottom: '16px',
            backgroundColor: darkMode ? '#2e2e2eff' : '#fee2e2'
          }}>
            📉 Top Losers
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {losers.length > 0 ? (
              losers.map(stock => renderStockItem(stock, false))
            ) : (
              <p style={{ color: '#666', textAlign: 'center' }}>
                No losers data available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingStocks;
