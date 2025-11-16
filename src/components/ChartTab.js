// ChartTab.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from './ThemeContext';
import { 
    LoadingSpinner, 
    TechnicalInfoSkeleton, 
    ChartSkeleton, 
    ListSkeleton 
} from './LoadingComponents';
import { periods } from './StocksDashboard'; // ייבוא רשימת התקופות מהקובץ הראשי

// פונקציה עזר להצגת לוגו (נשארת מחוץ לקומפוננטה הראשית)
const getStockLogo = (symbol) => {
    try {
      return require(`../assets/${symbol.toLowerCase()}.png`);
    } catch (error) {
      return null;
    }
};

export default function ChartTab({
    ticker,
    error,
    loading,
    filteredHistory,
    predictions,
    technicalInfo,
    overview,
    range,
    setRange,
    periodChanges,
    chartData,
    chartOptions
}) {
    const { darkMode } = useTheme();
    
    // --- Render Logic ---
    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (loading) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 20, paddingTop: 10 }}>
                    <LoadingSpinner size={32} color={darkMode ? '#64b5f6' : '#2196f3'}/>
                    <span style={{ fontSize: '14px', color: darkMode ? '#aaa' : '#666' }}>
                        Loading stock data for {ticker}...
                    </span>
                </div>
                <TechnicalInfoSkeleton darkMode={darkMode} />
                <ChartSkeleton darkMode={darkMode} />
                <div style={{ marginTop: 20, padding: 16, background: darkMode ? '#1e1e1e' : '#fff', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>📈 Predictions</h4>
                    <ListSkeleton darkMode={darkMode} count={3} />
                </div>
            </div>
        );
    }
    
    if (filteredHistory.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#aaa' : '#666' }}>
                No historical data available for {ticker}.
            </div>
        );
    }

    // --- Content Render ---
    return (
        <div>
            {/* Technical Info Panel */}
            <div style={{ 
                marginBottom: 20, 
                padding: 16, 
                border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, 
                borderRadius: '8px', 
                background: darkMode ? '#1e1e1e' : '#fff' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                    {/* Logo Section */}
                    {getStockLogo(ticker) ? (
                        <img 
                            src={getStockLogo(ticker)} 
                            alt={`${ticker} Logo`} 
                            style={{ width: 48, height: 48, marginRight: 16, borderRadius: '4px', border: '1px solid #eee' }} 
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'block'; }} 
                        />
                    ) : (
                        <div style={{ width: 48, height: 48, marginRight: 16, borderRadius: '4px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#333' : '#f0f0f0', color: darkMode ? '#999' : '#666', fontSize: '18px', fontWeight: 'bold' }}>
                            {ticker.slice(0, 2)}
                        </div>
                    )}
                    
                    <div>
                        {/* Company Name */}
                        <h3 style={{ margin: 0, fontWeight: 'bold' }}>
                            {(function() {
                                switch(ticker) {
                                    case 'MSFT': return 'Microsoft Corp.';
                                    case 'AAPL': return 'Apple Inc.'; 
                                    case 'T': return 'AT&T Inc.';
                                    case 'IBM': return 'IBM';
                                    default: return overview?.name || ticker;
                                }
                            })()}
                        </h3>
                        <div style={{ fontSize: '14px', color: darkMode ? '#bbb' : '#666' }}>{ticker} Stock Quote</div>
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`, 
                    paddingTop: 10 
                }}>
                    {/* Last Close Price */}
                    <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                        <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#2196f3' }}>
                            ${parseFloat(technicalInfo.last_close).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>LAST CLOSE</div>
                    </div>
                    
                    {/* Last Open Price */}
                    <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                            ${parseFloat(technicalInfo.last_open).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>LAST OPEN</div>
                    </div>
                    
                    {/* Last Volume */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                            {parseInt(technicalInfo.last_volume).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>LAST VOLUME</div>
                    </div>
                </div>
            </div>
            {/* END: Technical Info Panel */}

            

            <div style={{ height: 500 }}>
                {chartData ? <Line data={chartData} options={chartOptions} /> : <div>No chart data</div>}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', marginTop: '12px' }}>
                {periods.map((p) => {
                    const isActive = range === p.value;
                    const pct = periodChanges[p.value];
                    const pctText = pct !== undefined ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '';

                    return (
                        <div key={p.value} onClick={() => setRange(p.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', backgroundColor: isActive ? (darkMode ? '#333' : '#e3f2fd') : (darkMode ? '#1e1e1e' : '#fff'), border: isActive ? '2px solid #2196f3' : '1px solid rgba(0,0,0,0.1)' }}>
                            <div style={{ fontWeight: 'bold' }}>{p.label}</div>
                            <div style={{ fontSize: '12px', color: pct > 0 ? '#059669' : pct < 0 ? '#dc2626' : darkMode ? '#aaa' : '#666' }}>{pctText}</div>
                        </div>
                    );
                })}
            </div>


            <div style={{ marginTop: 20, padding: 16, border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff' }}>
                <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                    📈 Predictions
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
                    {predictions.map((p, idx) => (
                        <li 
                            key={idx} 
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                padding: '8px 0', 
                                borderBottom: idx < predictions.length - 1 ? `1px dotted ${darkMode ? '#333' : '#eee'}` : 'none' 
                            }}
                        >
                            <span style={{ color: darkMode ? '#bbb' : '#444' }}>
                                {p.date}
                            </span>
                            <strong style={{ color: '#059669' }}>
                                ${p.predicted_close.toFixed(2)}
                            </strong>
                        </li>
                    ))}
                </ul>
                {predictions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '10px 0', color: darkMode ? '#aaa' : '#666', fontSize: '13px' }}>
                        No upcoming predictions.
                    </div>
                )}
            </div>
        </div>
    );
}