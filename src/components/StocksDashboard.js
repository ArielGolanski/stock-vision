import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useTheme } from './ThemeContext';
import { API_URL } from '../config';

ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Title
);

// Moved outside the component to prevent re-creation on every render
const periods = [
    { label: '1D', value: '1d', days: 1 },
    { label: '1W', value: '1w', days: 5 },
    { label: '1M', value: '1mo', days: 21 },
    { label: '6M', value: '6mo', days: 126 },
    { label: '1Y', value: '1y', days: 252 },
    { label: '3Y', value: '3y', days: 756 },
    { label: '5Y', value: '5y', days: 1260 },
    { label: '10Y', value: '10y', days: 2520 },
];

export default function StocksDashboard() {
    const { darkMode } = useTheme();

    const [ticker, setTicker] = useState('MSFT');
    const [range, setRange] = useState('1y');
    const [predictionType, setPredictionType] = useState('daily');
    const [fullHistory, setFullHistory] = useState([]); // always 10 years
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [technicalInfo, setTechnicalInfo] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [periodChanges, setPeriodChanges] = useState({});
    const [activeTab, setActiveTab] = useState('chart');
    const [news, setNews] = useState([]);
    const [overview, setOverview] = useState(null);
    const [newsLoading, setNewsLoading] = useState(false);
    const [overviewLoading, setOverviewLoading] = useState(false);

    // HypeMeter state
    const [hypeData, setHypeData] = useState(null);
    const [hypeLoading, setHypeLoading] = useState(false);
    const [hypeTimeframe, setHypeTimeframe] = useState('day');

    // Discussion state
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Risk Calculator State 
    const [investmentAmount, setInvestmentAmount] = useState(1000); 
    const [userFees, setUserFees] = useState({ feePerShare: 0, feeMinimum: 0 });
    const [feesLoading, setFeesLoading] = useState(false);
    // ----------------------------


    // Get current user ID and FETCH FEES from token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);

                // --- FETCH FEES from /api/users/profile ---
                setFeesLoading(true);
                fetch(`${API_URL}/api/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                .then(res => res.json())
                .then(data => {
                    setUserFees({
                        feePerShare: data.customFeePerShare || 0,
                        feeMinimum: data.customFeeMinimum || 0,
                    });
                })
                .catch(err => console.error("Error fetching user fees:", err))
                .finally(() => setFeesLoading(false));
                // ------------------------------------------

            } catch (err) {
                console.error('Error parsing token:', err);
            }
        }
    }, []);

    /** Helper: get cutoff date by range **/
    function getCutoffDate(range) {
        const d = new Date();
        switch (range) {
            case '1d': d.setDate(d.getDate() - 1); break;
            case '1w': d.setDate(d.getDate() - 7); break;
            case '1mo': d.setMonth(d.getMonth() - 1); break;
            case '6mo': d.setMonth(d.getMonth() - 6); break;
            case '1y': d.setFullYear(d.getFullYear() - 1); break;
            case '3y': d.setFullYear(d.getFullYear() - 3); break;
            case '5y': d.setFullYear(d.getFullYear() - 5); break;
            default: d.setFullYear(d.getFullYear() - 10);
        }
        return d;
    }

    /** Fetch 10y history once per ticker **/
    const fetchFullHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                ticker,
                range: '10y',
                predictionType,
            });

            const resp = await fetch(`${API_URL}/api/stock-history?${params.toString()}`);
            if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${resp.status}`);
            }

            const json = await resp.json();
            setFullHistory(json.history || []);
            setPredictions(json.predictions || []);
            setTechnicalInfo(json.technical_info || {});

            // compute percent changes based on full history
            if (json.history && json.history.length > 1) {
                const closes = json.history.map(h => h.close);
                const newChanges = {};
                periods.forEach(p => {
                    const index = Math.max(closes.length - p.days, 0);
                    const pastPrice = closes[index];
                    const lastPrice = closes[closes.length - 1];
                    if (pastPrice && lastPrice) {
                        const pct = ((lastPrice - pastPrice) / pastPrice) * 100;
                        newChanges[p.value] = pct;
                    }
                });
                setPeriodChanges(newChanges);
            }
        } catch (err) {
            setError(err.message);
            setFullHistory([]);
            setPredictions([]);
        } finally {
            setLoading(false);
        }
    }, [ticker, predictionType]);

    /** Slice full history based on selected range **/
    useEffect(() => {
        if (fullHistory.length > 0) {
            const cutoff = getCutoffDate(range);
            const filtered = fullHistory.filter(h => new Date(h.date) >= cutoff);
            setFilteredHistory(filtered);
        }
    }, [range, fullHistory]);

    const fetchNews = useCallback(async () => {
        setNewsLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/stocks/news?ticker=${ticker}`
            );
            if (!res.ok) throw new Error(`Failed to fetch news`);
            const json = await res.json();
            setNews(json.articles || []);
        } catch (err) {
            console.error('News fetch error:', err);
            setNews([]);
        } finally {
            setNewsLoading(false);
        }
    }, [ticker]);

    const fetchOverview = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/stocks/overview?ticker=${ticker}`
            );
            if (!res.ok) throw new Error(`Failed to fetch overview`);
            const json = await res.json();
            setOverview(json);
        } catch (err) {
            console.error('Overview fetch error:', err);
            setOverview(null);
        } finally {
            setOverviewLoading(false);
        }
    }, [ticker]);

    const fetchComments = useCallback(async () => {
        setCommentsLoading(true);
        setCommentError(null);
        try {
            const res = await fetch(
                `${API_URL}/api/comments?ticker=${ticker}`
            );
            if (!res.ok) throw new Error(`Failed to fetch comments`);
            const json = await res.json();
            setComments(json.comments || []);
        } catch (err) {
            console.error('Comments fetch error:', err);
            setCommentError(err.message);
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [ticker]);

    // Fetch Hype Data
    const fetchHypeData = useCallback(async () => {
        setHypeLoading(true);
        setHypeData(null);
        try {
            const res = await fetch(
                `${API_URL}/api/hypemeter?ticker=${ticker}&timeframe=${hypeTimeframe}`
            );
            if (!res.ok) throw new Error(`Failed to fetch hype data`);
            const json = await res.json();
            setHypeData(json);
        } catch (err) {
            console.error('Hype fetch error:', err);
        } finally {
            setHypeLoading(false);
        }
    }, [ticker, hypeTimeframe]);

    const handleSubmitComment = useCallback(async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        setCommentError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to comment');
            }

            const res = await fetch(`${API_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ticker,
                    content: newComment
                })
            });

            if (!res.ok) {
                const errBody = await res.json();
                throw new Error(errBody.message || 'Failed to post comment');
            }

            setNewComment('');
            await fetchComments(); // Refetch comments after submission
        } catch (err) {
            console.error('Comment submission error:', err);
            setCommentError(err.message);
        } finally {
            setSubmitting(false);
        }
    }, [newComment, ticker, fetchComments]);

    const handleDeleteComment = useCallback(async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to delete comments');
            }

            const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errBody = await res.json();
                throw new Error(errBody.message || 'Failed to delete comment');
            }

            await fetchComments(); // Refetch comments after deletion
        } catch (err) {
            console.error('Comment deletion error:', err);
            alert(err.message);
        }
    }, [fetchComments]);

    const getStockLogo = (symbol) => {
    try {
      return require(`../assets/${symbol.toLowerCase()}.png`);
    } catch (error) {
      console.warn(`Logo not found for ${symbol}`);
      return null;
    }
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // This effect fetches data that depends on both the ticker and the prediction type
    useEffect(() => {
        fetchFullHistory();
    }, [fetchFullHistory]);

    // This effect fetches data that only depends on the ticker
    useEffect(() => {
        fetchNews();
        fetchOverview();
        fetchComments();
    }, [fetchNews, fetchOverview, fetchComments]);


    // This effect fetches Hype Data when ticker or timeframe changes
    useEffect(() => {
        fetchHypeData();
    }, [fetchHypeData]);


    // --------------------------------------------------------------------------------------
    // --- Risk Calculator Logic (MODIFIED to return array of 5 days) ---
    // --------------------------------------------------------------------------------------
    const riskCalculation = useMemo(() => {
        if (!technicalInfo || !predictions.length || !investmentAmount || loading || feesLoading) return null;
        
        const currentPrice = technicalInfo.last_close; 
        if (!currentPrice || currentPrice <= 0) return { error: "Current stock price not available." };
        
        // נשתמש רק ב-5 התחזיות הראשונות (ל-5 הימים הקרובים)
        const fiveDayPredictions = predictions.slice(0, 5); 
        
        if (fiveDayPredictions.length === 0) return { error: "5-day prediction data not available." };

        // 1. חישוב מספר מניות שניתן לקנות (קבוע לכל ימי התחזית)
        const sharesToBuy = Math.floor(investmentAmount / currentPrice);
        
        if (sharesToBuy === 0) return { error: "Amount too small to buy even one share." };
        
        // 2. חישוב עלות עסקאות קבועה (Fees)
        // עלות קנייה (Purchase cost):
        const buyFee = Math.max(userFees.feePerShare * sharesToBuy, userFees.feeMinimum); 
        const sellFeeBase = Math.max(userFees.feePerShare * sharesToBuy, userFees.feeMinimum); // בסיס עמלת מכירה
        const totalBaseFees = buyFee + sellFeeBase; // סכום העמלות הקבוע (קנייה + מכירה)
        const TAX_RATE = 0.25;

        const results = fiveDayPredictions.map(p => {
            const futurePrediction = p.predicted_close;
            
            // חישוב רווח ברוטו
            const grossProfitPerShare = futurePrediction - currentPrice;
            const grossProfitTotal = sharesToBuy * grossProfitPerShare;
            
            // חישוב מס
            const taxableProfit = grossProfitTotal > 0 ? grossProfitTotal : 0;
            const taxAmount = taxableProfit * TAX_RATE; 
            
            // חישוב רווח נטו
            const netProfit = grossProfitTotal - totalBaseFees - taxAmount;

            return {
                date: p.date,
                predictedClose: futurePrediction,
                grossProfitTotal: grossProfitTotal,
                totalFees: totalBaseFees,
                taxAmount: taxAmount,
                netProfit: netProfit,
            };
        });

        // מציאת הרווח המקסימלי לשימוש בתצוגה
        const maxProfitResult = results.reduce((max, current) => 
            current.netProfit > max.netProfit ? current : max, results[0]
        );

        return {
            currentPrice,
            sharesToBuy,
            ticker,
            maxProfitResult,
            results,
            error: null,
        };
    }, [technicalInfo, predictions, investmentAmount, loading, feesLoading, userFees]);
    // --------------------------------------------------------------------------------------


    const chartData = useMemo(() => {
        if (filteredHistory.length === 0) return null;
        const histData = filteredHistory.map(h => ({ x: h.date, y: h.close }));
        const predData = predictions.map(p => ({ x: p.date, y: p.predicted_close }));

        // smooth red connection line from last history to first prediction
        if (histData.length > 0 && predData.length > 0) {
            const lastHist = histData[histData.length - 1];
            const firstPred = predData[0];
            if (lastHist.x !== firstPred.x) {
                predData.unshift({ x: lastHist.x, y: lastHist.y });
            }
        }

        return {
            datasets: [
                {
                    label: 'Historical Close',
                    data: histData,
                    tension: 0.2,
                    pointRadius: 2,
                    borderWidth: 2,
                    borderColor: darkMode ? 'rgba(100, 181, 246, 1)' : 'rgba(33, 133, 208, 1)',
                },
                {
                    label: 'Predicted Close',
                    data: predData,
                    tension: 0.2,
                    pointRadius: 4,
                    borderWidth: 2,
                    borderDash: [8, 6],
                    borderColor: darkMode ? 'rgba(239, 83, 80, 1)' : 'rgba(220, 78, 65, 1)',
                },
            ],
        };
    }, [filteredHistory, predictions, darkMode]);

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                mode: 'nearest',
                callbacks: {
                    label: function (context) {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: ${val != null ? val.toFixed(2) : 'N/A'}`;
                    },
                },
            },
            legend: { position: 'top' },
        },
        scales: {
            x: { type: 'time', time: { unit: 'day', tooltipFormat: 'PPP' } },
            y: { beginAtZero: false },
        },
    };

    const hypeTimeframes = [
        { label: 'Past Day', value: 'day' },
        { label: 'Past Week', value: 'week' },
        { label: 'Past Month', value: 'month' },
    ];


    return (
        <div style={{ padding: 20, background: darkMode ? '#2e2e2eff' : '#fafafa', color: darkMode ? '#f1f1f1' : '#111', borderRadius: '8px' }}>
            <h2>Stocks Dashboard</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
                    <option value="MSFT">Microsoft</option>
                    <option value="AAPL">Apple</option>
                    <option value="T">AT&T</option>
                    <option value="IBM">IBM</option>
                </select>

                <label>
                    <input type="radio" checked={predictionType === 'daily'} onChange={() => setPredictionType('daily')} /> Daily
                </label>
                <label>
                    <input type="radio" checked={predictionType === 'monthly'} onChange={() => setPredictionType('monthly')} /> Monthly
                </label>
            </div>



            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                {['chart', 'news', 'overview', 'discussion', 'hype',  'risk'].map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '6px 12px', borderRadius: '6px', border: activeTab === tab ? '2px solid #2196f3' : '1px solid #ccc', background: activeTab === tab ? '#2196f3' : 'transparent', color: activeTab === tab ? '#fff' : darkMode ? '#f1f1f1' : '#111', cursor: 'pointer' }}>
                        {tab === 'hype' ? 'HypeMeter' : tab === 'risk' ? 'Risk Calculator' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'chart' && (
                <>
                    {error && <div style={{ color: 'red' }}>Error: {error}</div>}
                    {loading && <div>Loading…</div>}
                    {!loading && filteredHistory.length > 0 && (
                        <div>
                            {/* START: NEW STYLED TECHNICAL INFO PANEL */}
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
                            {/* END: NEW STYLED TECHNICAL INFO PANEL */}

                            

                            <div style={{ height: 500 }}>
                                {chartData ? <Line data={chartData} options={chartOptions} /> : <div>No chart data</div>}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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
                    )}
                    {loading && <div>Loading…</div>}
                </>
            )}
            
            {/* --- Risk Calculator Tab Content (MODIFIED) --- */}
            {activeTab === 'risk' && (
                <div style={{ padding: '20px', borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff', border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}` }}>
                    <h3 style={{ margin: '0 0 15px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                        Risk Calculator: Net Profit Forecast (Next 5 Days)
                    </h3>

                    {(feesLoading || loading) ? (
                        <p>Loading user data and stock info...</p>
                    ) : (
                        <div style={{ marginBottom: '20px', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: '15px' }}>
                            <div style={{ marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <label style={{ fontWeight: 'bold' }}>
                                    Investment Amount (USD):
                                </label>
                                <input
                                    type="number"
                                    step="100"
                                    value={investmentAmount}
                                    onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '150px' }}
                                />
                            </div>

                            <p style={{ fontSize: '13px', color: darkMode ? '#aaa' : '#666' }}>
                                **Your Fees (from Settings)**: Fee Per Share: ${userFees.feePerShare.toFixed(4)}, Minimum Fee: ${userFees.feeMinimum.toFixed(2)}
                            </p>
                            <p style={{ fontSize: '13px', color: '#dc2626' }}>
                                **Tax Rate Applied**: 25% on gross profit.
                            </p>
                            
                            {riskCalculation?.currentPrice && (
                                <p style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '10px' }}>
                                    **Purchase Price**: ${riskCalculation.currentPrice.toFixed(2)} | **Shares Purchased**: {riskCalculation.sharesToBuy}
                                </p>
                            )}
                        </div>
                    )}


                    {riskCalculation?.error && (
                         <div style={{ color: '#dc2626', fontWeight: 'bold', padding: '10px', border: '1px solid #dc2626', borderRadius: '4px' }}>
                            {riskCalculation.error}
                        </div>
                    )}
                    
                    {riskCalculation && riskCalculation.results?.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: darkMode ? '#f1f1f1' : '#111', borderBottom: `1px dotted ${darkMode ? '#333' : '#eee'}`, paddingBottom: '10px' }}>
                                📅 Daily Net Profit Forecast (Next 5 Days)
                            </h4>
                            
                            {riskCalculation.maxProfitResult && (
                                <div style={{ 
                                    padding: '10px', 
                                    marginBottom: '15px', 
                                    background: riskCalculation.maxProfitResult.netProfit > 0 ? (darkMode ? '#0f4f3a' : '#dcfce7') : (darkMode ? '#4f0f0f' : '#fee2e2'), 
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                }}>
                                    Optimal Sale Day: **{riskCalculation.maxProfitResult.date}** with Net Profit: 
                                    <span style={{ color: riskCalculation.maxProfitResult.netProfit >= 0 ? '#059669' : '#dc2626', marginLeft: '5px' }}>
                                        ${riskCalculation.maxProfitResult.netProfit.toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${darkMode ? '#444' : '#ccc'}`, textAlign: 'left' }}>
                                        <th style={{ padding: '8px 4px' }}>Date</th>
                                        <th style={{ padding: '8px 4px' }}>Predicted Close</th>
                                        <th style={{ padding: '8px 4px', textAlign: 'right' }}>Gross Profit</th>
                                        <th style={{ padding: '8px 4px', textAlign: 'right' }}>Fees + Tax</th>
                                        <th style={{ padding: '8px 4px', textAlign: 'right' }}>Net Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riskCalculation.results.map((r, index) => (
                                        <tr 
                                            key={index} 
                                            style={{ 
                                                borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                                                background: r.netProfit === riskCalculation.maxProfitResult.netProfit ? (darkMode ? '#3b3b00' : '#fffbe7') : 'transparent'
                                            }}
                                        >
                                            <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{r.date}</td>
                                            <td style={{ padding: '8px 4px' }}>${r.predictedClose.toFixed(2)}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right', color: r.grossProfitTotal >= 0 ? '#059669' : '#dc2626' }}>${r.grossProfitTotal.toFixed(2)}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>${(r.totalFees + r.taxAmount).toFixed(2)}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold', color: r.netProfit >= 0 ? '#059669' : '#dc2626' }}>
                                                ${r.netProfit.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {/* --- END Risk Calculator Tab Content --- */}


            {activeTab === 'news' && (
                <div>
                    {newsLoading && <div>Loading news…</div>}
                    {!newsLoading && news.length === 0 && <div>No news available.</div>}
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {news.map((article, idx) => (
                            <li key={idx} style={{ padding: '10px', borderBottom: '1px solid #ddd', marginBottom: '8px' }}>
                                <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? '#90caf9' : '#1a0dab', fontWeight: 'bold', textDecoration: 'none' }}>
                                    {article.headline}
                                </a>
                                <div style={{ fontSize: '12px', color: '#666' }}>{article.source} — {article.date}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'overview' && (
                <div>
                    {overviewLoading && <div>Loading overview…</div>}
                    {!overviewLoading && !overview && <div>No overview available.</div>}
                    {overview && (
                        <div style={{ 
                            padding: 20, 
                            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, 
                            borderRadius: '8px', 
                            background: darkMode ? '#1e1e1e' : '#fff' 
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                                Company Overview
                            </h3>
                            
                            {/* Header: Name and Ticker */}
                            <div style={{ marginBottom: 15, borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: 10 }}>
                                <h4 style={{ margin: 0, fontWeight: 'bold' }}>
                                    {overview.name} ({overview.symbol})
                                </h4>
                            </div>

                            {/* Description */}
                            <p style={{ lineHeight: '1.6', fontSize: '14px', color: darkMode ? '#ccc' : '#444' }}>
                                {overview.description}
                            </p>

                            {/* Key Financial and Sector Info */}
                            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '14px' }}>
                                
                                <div>
                                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Sector:</strong> {overview.sector}
                                </div>
                                
                                <div>
                                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Industry:</strong> {overview.industry}
                                </div>

                                <div>
                                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Market Cap:</strong> {overview.marketCap}
                                </div>
                                
                                <div>
                                    <strong style={{ color: darkMode ? '#bbb' : '#333' }}>Website:</strong> 
                                    <a 
                                        href={overview.website} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        style={{ color: darkMode ? '#90caf9' : '#2196f3', textDecoration: 'none' }}
                                    >
                                        Link
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* HypeMeter Tab Content */}
            {activeTab === 'hype' && (
                <div>
                    <h3 style={{ marginBottom: '16px' }}>HypeMeter for {ticker}</h3>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {hypeTimeframes.map((tf) => (
                            <button key={tf.value} onClick={() => setHypeTimeframe(tf.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: hypeTimeframe === tf.value ? '2px solid #2196f3' : '1px solid #ccc', background: hypeTimeframe === tf.value ? '#2196f3' : 'transparent', color: hypeTimeframe === tf.value ? '#fff' : darkMode ? '#f1f1f1' : '#111', cursor: 'pointer' }}>
                                {tf.label}
                            </button>
                        ))}
                    </div>

                    {hypeLoading && <div>Loading hype data...</div>}
                    {!hypeLoading && !hypeData && <div>Failed to load hype data.</div>}

                    {hypeData && (
                        <>
                            

                            <div style={{ padding: '16px', borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff', border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}` }}>
                                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: hypeData.hypeLevel.color }}>
                                        {hypeData.hypeLevel.label}
                                    </div>
                                    <div style={{ fontSize: '48px', fontWeight: 'extrabold', color: hypeData.hypeLevel.color, margin: '10px 0' }}>
                                        {hypeData.hypeScore}%
                                    </div>
                                    <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>
                                        Hype Score for the {hypeData.timeframe} (Reddit)
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{hypeData.mentions}</div>
                                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Mentions</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>{hypeData.sentiment.positive.toFixed(1)}%</div>
                                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Positive</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>{hypeData.sentiment.negative.toFixed(1)}%</div>
                                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Negative</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{hypeData.sentiment.averageScore.toFixed(2)}</div>
                                        <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>Avg. Sentiment</div>
                                    </div>
                                </div>

                                <h4 style={{ borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, paddingTop: '16px', marginBottom: '10px' }}>Top Posts</h4>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {hypeData.topPosts.map((post, idx) => (
                                        <li key={idx} style={{ marginBottom: '10px', borderBottom: `1px dotted ${darkMode ? '#222' : '#f0f0f0'}`, paddingBottom: '8px' }}>
                                            <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? '#90caf9' : '#1a0dab', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
                                                {post.title}
                                            </a>
                                            <div style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666', marginTop: '4px' }}>
                                                <span style={{ color: post.sentiment === 'positive' ? '#059669' : post.sentiment === 'negative' ? '#dc2626' : '#ffaa00', fontWeight: 'bold' }}>
                                                    {post.sentiment.toUpperCase()}
                                                </span>
                                                {' | '}
                                                r/{post.subreddit}
                                                {' | '}
                                                Score: {post.score}
                                                {' | '}
                                                Comments: {post.numComments}
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div style={{ fontSize: '10px', color: darkMode ? '#555' : '#999', marginTop: '16px', textAlign: 'right' }}>
                                    Data last updated: {new Date(hypeData.lastUpdated).toLocaleString()}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px', background: darkMode ? '#282828' : '#e0f7fa', border: `1px solid ${darkMode ? '#444' : '#b2ebf2'}` }}>
                                <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#64b5f6' : '#00bcd4' }}>
                                    💡 How the Hype Score is Calculated
                                </h4>
                                <p style={{ margin: '0 0 10px 0', fontSize: '13px', lineHeight: '1.4', color: darkMode ? '#ccc' : '#444' }}>
                                    The **Hype Score** (0-100%) is calculated by aggregating data from top finance subreddits ({hypeData.timeframe} timeframe) based on four weighted factors:
                                </p>
                                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: darkMode ? '#ccc' : '#444' }}>
                                    <li>**Mention Score (Max 30%):** Based on the sheer volume of posts mentioning the ticker.</li>
                                    <li>**Sentiment Score (Max 40%):** Calculated from the net positive vs. negative sentiment of all analyzed posts.</li>
                                    <li>**Engagement Score (Max 20%):** Measures the average upvotes and comments on the top posts, indicating user interaction.</li>
                                    <li>**Trend Score (Max 10%):** Weighs posts from the last 6 hours more heavily to capture recent activity.</li>
                                </ul>
                                {/* START: Added Sentiment Score Explanation */}
                                <h5 style={{ margin: '15px 0 5px 0', color: darkMode ? '#90caf9' : '#0097a7', fontSize: '13px' }}>
                                    Details: Individual Post Sentiment Score
                                </h5>
                                <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: darkMode ? '#bbb' : '#555' }}>
                                    <li>**Lexicon:** Sentiment is determined using the AFINN-165 wordlist (over 3,300 emotional words).</li>
                                    <li>**Word Scoring:** Each recognized word is assigned a fixed score from -5 (negative) to +5 (positive).</li>
                                    <li>**Calculation:** The post's total `sentimentScore` is the sum of all scores of the emotional words found in its title and body.</li>
                                </ul>
                                {/* END: Added Sentiment Score Explanation */}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Existing Discussion Tab Content */}
            {activeTab === 'discussion' && (
                <div>
                    <h3 style={{ marginBottom: '16px' }}>Discussion for {ticker}</h3>

                    <div style={{ marginBottom: '24px' }}>
                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Share your thoughts about this stock..." maxLength={1000} style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#444' : '#ccc'}`, background: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#f1f1f1' : '#111', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{newComment.length}/1000</span>
                            <button onClick={handleSubmitComment} disabled={submitting || !newComment.trim()} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: submitting || !newComment.trim() ? '#ccc' : '#2196f3', color: '#fff', cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                {submitting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                        {commentError && <div style={{ color: '#dc2626', marginTop: '8px', fontSize: '14px' }}>{commentError}</div>}
                    </div>

                    {commentsLoading && <div>Loading comments…</div>}
                    {!commentsLoading && comments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#aaa' : '#666' }}>
                            No comments yet. Be the first to share your thoughts!
                        </div>
                    )}
                    <div>
                        {comments.map((comment) => (
                            <div key={comment._id} style={{ padding: '16px', borderRadius: '8px', background: darkMode ? '#1e1e1e' : '#fff', border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                    <div>
                                        <strong style={{ color: darkMode ? '#90caf9' : '#2196f3' }}>{comment.firstName}</strong>
                                        <span style={{ marginLeft: '8px', fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{formatDate(comment.createdAt)}</span>
                                    </div>
                                    {currentUserId === comment.userId && (
                                        <button onClick={() => handleDeleteComment(comment._id)} style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                                <p style={{ margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}