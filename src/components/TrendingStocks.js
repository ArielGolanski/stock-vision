import React, { useEffect, useState, useCallback } from 'react'; // 👈 הוספת useCallback
import { useTheme } from "./ThemeContext";
import { API_URL } from "../config";

// ------------------- Skeleton Loader Component -------------------

/**
 * Skeleton Loader for the Trending Stock Lists (Gainers and Losers)
 */
function StockListSkeleton({ darkMode, count = 5 }) {
    const skeletonStyle = (i) => ({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        margin: '6px 0',
        borderRadius: '0',
        borderBottom: `1px solid ${darkMode ? '#2c2c2c' : '#eee'}`,
        position: 'relative',
        overflow: 'hidden',
        animation: 'pulse 1.5s ease-in-out infinite',
        animationDelay: `${i * 0.1}s`,
    });

    return (
        <div style={{ padding: '0 0px' }}>
            {[...Array(count)].map((_, i) => (
                <div key={i} style={skeletonStyle(i)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Fake Logo */}
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            backgroundColor: darkMode ? '#333' : '#e0e0e0',
                        }} />
                        <div>
                            {/* Fake Symbol */}
                            <div style={{
                                width: '60px',
                                height: '14px',
                                backgroundColor: darkMode ? '#333' : '#e0e0e0',
                                borderRadius: '4px',
                                marginBottom: '4px'
                            }} />
                            {/* Fake Price */}
                            <div style={{
                                width: '55px',
                                height: '10px',
                                backgroundColor: darkMode ? '#333' : '#e0e0e0',
                                borderRadius: '3px'
                            }} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        {/* Fake % Change */}
                        <div style={{
                            width: '50px',
                            height: '14px',
                            backgroundColor: darkMode ? '#333' : '#e0e0e0',
                            borderRadius: '4px',
                            marginBottom: '4px'
                        }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ------------------- Keyframes for Skeleton (Pulse) -------------------
const GlobalSkeletonStyles = () => (
    <style>{`
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `}</style>
);
// ------------------- END: Skeleton Loader Component -------------------

// Spinner for the refresh button
function RefreshSpinner({ size = 16, color = '#2196f3' }) {
    return (
        <div style={{
            width: size,
            height: size,
            border: `2px solid rgba(33, 150, 243, 0.1)`,
            borderTop: `2px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            display: 'inline-block',
            marginRight: '4px',
            verticalAlign: 'middle',
        }} />
    );
}


const TrendingStocks = () => {
  const { darkMode } = useTheme();

  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. עוטפים את fetchStocks ב-useCallback
  const fetchStocks = useCallback(async () => {
    try {
      if (gainers.length === 0 && losers.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
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
      setIsRefreshing(false);
    }
    // מערך תלויות ריק כי הפונקציה לא משתמשת ב-props או state משתנים שאינם מוגדרים בתוכה
  }, [gainers.length, losers.length]); // 👈 הוספת תלויות רלוונטיות

  // 2. מוסיפים את fetchStocks למערך התלויות
  useEffect(() => {
    fetchStocks();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStocks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchStocks]); // 👈 תיקון האזהרה: fetchStocks נוספה למערך התלויות

  const formatPrice = (price) => {
    // Format price to US dollars with two decimal places
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStockLogo = (symbol) => {
    try {
      // Assuming assets path is correct
      return require(`../assets/${symbol.toLowerCase()}.png`);
    } catch (error) {
      console.warn(`Logo not found for ${symbol}`);
      return null;
    }
  };

  const renderStockItem = (stock, isGainer) => (
    <div
      key={stock.symbol}
      className="stock-item-detail"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0', 
        margin: '0',
        borderBottom: `1px solid ${darkMode ? '#2c2c2c' : '#eee'}`, 
        backgroundColor: darkMode ? '#111827' : (isGainer ? '#f7fcf7' : '#fff7f7'),
        transition: 'background-color 0.2s ease, transform 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = darkMode ? '#1f1f1f' : (isGainer ? '#e6fff0' : '#ffe6e6'); 
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = darkMode ? '#111827' : (isGainer ? '#f7fcf7' : '#fff7f7');
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Logo/Symbol Container */}
        <div style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: darkMode ? '#000000' : '#f0f0f0',
          borderRadius: '4px',
          border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`
        }}>
          {getStockLogo(stock.symbol) ? (
            <img
              src={getStockLogo(stock.symbol)}
              alt={`${stock.symbol} logo`}
              style={{
                width: '20px', 
                height: '20px',
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
              color: darkMode ? '#999' : '#6b7280',
              textAlign: 'center'
            }}>
              {stock.symbol.slice(0, 2)}
            </div>
          )}
          <div style={{
            display: 'none',
            fontSize: '10px',
            fontWeight: 'bold',
            color: darkMode ? '#999' : '#6b7280',
            textAlign: 'center'
          }}>
            {stock.symbol.slice(0, 2)}
          </div>
        </div>
        
        {/* Name and Price */}
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: darkMode ? '#f1f1f1' : '#111' }}>
            {stock.symbol}
          </div>
          <div style={{ fontSize: '12px', color: darkMode ? '#bbb' : '#444', fontWeight: '500' }}>
            {formatPrice(stock.price)}
          </div>
        </div>
      </div>
      
      {/* Change % and Value */}
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

  // --- Utility function for the header rendering (used in both loading and content states) ---
  const renderHeader = (isLoading) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, // Subtle separator
        paddingBottom: '10px'
      }}
    >
      <h2 style={{ margin: 0, color: darkMode ? '#e0e0e0' : '#111' }}>📈 Trending Stocks</h2>
      
      {isLoading ? (
        <div style={{ width: '150px', height: '30px', backgroundColor: darkMode ? '#333' : '#e0e0e0', borderRadius: '6px' }} />
      ) : (
        <div 
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '12px', 
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: darkMode ? '#282828' : '#f3f4f6',
                border: `1px solid ${darkMode ? '#444' : '#d1d5db'}`,
                color: darkMode ? '#bbb' : '#666'
            }}
        >
            {/* Last Updated Text */}
            <span style={{ marginRight: '8px' }}>
                Updated: {lastUpdated}
            </span>

            {/* Refresh Button */}
            <button
                onClick={fetchStocks}
                disabled={isRefreshing}
                style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: isRefreshing ? (darkMode ? '#444' : '#ccc') : (darkMode ? '#3b82f6' : '#2196f3'),
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    color: '#fff',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {isRefreshing ? (
                    <>
                        <RefreshSpinner size={14} color="#fff" />
                        Loading...
                    </>
                ) : 'Refresh'}
            </button>
        </div>
      )}
    </div>
  );

  // --- Loading State Render ---
  if (loading) {
    return (
      <>
        <GlobalSkeletonStyles />
        <div
          style={{
            padding: '20px',
            width: '100%',
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#f1f1f1' : '#111',
            borderRadius: '8px',
          }}
        >
            {renderHeader(true)}
            
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px' 
            }}>
              {/* Top Gainers Skeleton */}
              <div style={{ border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`, borderRadius: '8px', padding: '16px', backgroundColor: darkMode ? '#111827' : '#ffffff' }}>
                  <div style={{
                      width: '100%',
                      height: '24px',
                      borderBottom: '3px solid #059669',
                      paddingBottom: '8px',
                      marginBottom: '16px'
                  }}>
                      <h3 style={{ margin: 0, color: '#059669' }}>📈 Top Gainers</h3>
                  </div>
                  <StockListSkeleton darkMode={darkMode} count={5} />
              </div>

              {/* Top Losers Skeleton */}
              <div style={{ border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`, borderRadius: '8px', padding: '16px', backgroundColor: darkMode ? '#111827' : '#ffffff' }}>
                  <div style={{
                      width: '100%',
                      height: '24px',
                      borderBottom: '3px solid #dc2626',
                      paddingBottom: '8px',
                      marginBottom: '16px'
                  }}>
                      <h3 style={{ margin: 0, color: '#dc2626' }}>📉 Top Losers</h3>
                  </div>
                  <StockListSkeleton darkMode={darkMode} count={5} />
              </div>
            </div>
        </div>
      </>
    );
  }

  // --- Error State Render ---
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: darkMode ? '#1e1e1e' : '#ffffff', borderRadius: '8px' }}>
        {renderHeader(false)}
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

  // --- Content Render ---
  return (
    <>
      <GlobalSkeletonStyles />
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
        {renderHeader(false)}

        {/* Vertical Stack Layout */}
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px' 
        }}>
          
          {/* Top Gainers Column (First in the vertical stack) */}
          <div style={{ 
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`, 
            borderRadius: '8px', 
            padding: '16px', 
            backgroundColor: darkMode ? '#111827' : '#ffffff',
          }}>
            <div style={{ 
              borderBottom: '3px solid #059669', 
              paddingBottom: '8px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{
                color: '#059669',
                margin: 0
              }}>
                📈 Top Gainers
              </h3>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {gainers.length > 0 ? (
                gainers.map(stock => renderStockItem(stock, true))
              ) : (
                <p style={{ color: darkMode ? '#aaa' : '#666', textAlign: 'center', padding: '10px' }}>
                  No gainers data available
                </p>
              )}
            </div>
          </div>

          {/* Top Losers Column (Second in the vertical stack) */}
          <div style={{ 
            border: `1px solid ${darkMode ? '#333' : '#e5e7eb'}`, 
            borderRadius: '8px', 
            padding: '16px', 
            backgroundColor: darkMode ? '#111827' : '#ffffff' 
          }}>
            <div style={{ 
              borderBottom: '3px solid #dc2626', 
              paddingBottom: '8px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{
                color: '#dc2626',
                margin: 0
              }}>
                📉 Top Losers
              </h3>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {losers.length > 0 ? (
                losers.map(stock => renderStockItem(stock, false))
              ) : (
                <p style={{ color: darkMode ? '#aaa' : '#666', textAlign: 'center', padding: '10px' }}>
                  No losers data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrendingStocks;