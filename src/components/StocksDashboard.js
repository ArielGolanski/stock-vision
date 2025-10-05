// client/src/components/StocksDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
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

    // Discussion state
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Get current user ID from token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);
            } catch (err) {
                console.error('Error parsing token:', err);
            }
        }
    }, []);

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
    async function fetchFullHistory() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                ticker,
                range: '10y',
                predictionType,
            });

            const resp = await fetch(`http://localhost:5001/api/stock-history?${params.toString()}`);
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
    }

    /** Slice full history based on selected range **/
    useEffect(() => {
        if (fullHistory.length > 0) {
            const cutoff = getCutoffDate(range);
            const filtered = fullHistory.filter(h => new Date(h.date) >= cutoff);
            setFilteredHistory(filtered);
        }
    }, [range, fullHistory]);

    /** Fetch data when ticker or predictionType changes **/
    useEffect(() => {
        fetchFullHistory();
        fetchNews();
        fetchOverview();
    }, [ticker, predictionType]);

    /** Fetch news **/
    async function fetchNews() {
        setNewsLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/stocks/news?ticker=${ticker}`);
            const json = await res.json();
            setNews(json.articles || []);
        } catch {
            setNews([]);
        } finally {
            setNewsLoading(false);
        }
    }

    /** Fetch overview **/
    async function fetchOverview() {
        setOverviewLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/stocks/overview?ticker=${ticker}`);
            const json = await res.json();
            setOverview(json);
        } catch {
            setOverview(null);
        } finally {
            setOverviewLoading(false);
        }
    }

    /** Chart data **/
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
                    pointRadius: 3,
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
                    label: (context) => {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: $${val != null ? val.toFixed(2) : 'N/A'}`;
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

    return (
        <div style={{ padding: 20, background: darkMode ? '#121212' : '#fafafa', color: darkMode ? '#f1f1f1' : '#111', borderRadius: '8px' }}>
            <h2>Stocks Dashboard</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
                    <option value="MSFT">Microsoft</option>
                    <option value="AAPL">Apple</option>
                    <option value="IBM">IBM</option>
                    <option value="T">AT&T</option>
                </select>

                <label>
                    <input
                        type="radio"
                        checked={predictionType === 'daily'}
                        onChange={() => setPredictionType('daily')}
                    /> Daily
                </label>
                <label>
                    <input
                        type="radio"
                        checked={predictionType === 'monthly'}
                        onChange={() => setPredictionType('monthly')}
                    /> Monthly
                </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {periods.map((p) => {
                    const isActive = range === p.value;
                    const pct = periodChanges[p.value];
                    const pctText = pct !== undefined ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '';
                    return (
                        <div
                            key={p.value}
                            onClick={() => setRange(p.value)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '6px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: isActive
                                    ? darkMode ? '#333' : '#e3f2fd'
                                    : darkMode ? '#1e1e1e' : '#fff',
                                border: isActive
                                    ? '2px solid #2196f3'
                                    : '1px solid rgba(0,0,0,0.1)',
                            }}
                        >
                            <div style={{ fontWeight: 'bold' }}>{p.label}</div>
                            <div style={{ fontSize: '12px', color: pct > 0 ? '#059669' : pct < 0 ? '#dc2626' : darkMode ? '#aaa' : '#666' }}>{pctText}</div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                {['chart', 'news', 'overview'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: activeTab === tab ? '2px solid #2196f3' : '1px solid #ccc',
                            background: activeTab === tab ? '#2196f3' : 'transparent',
                            color: activeTab === tab ? '#fff' : darkMode ? '#f1f1f1' : '#111',
                            cursor: 'pointer',
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'chart' && (
                <>
                    {error && <div style={{ color: 'red' }}>Error: {error}</div>}
                    {loading && <div>Loading…</div>}

                    {!loading && filteredHistory.length > 0 && (
                        <>
                            <div style={{ marginBottom: 12 }}>
                                <strong>Technical Info:</strong>
                                <div>Last Close: ${technicalInfo.last_close}</div>
                                <div>Last Open: ${technicalInfo.last_open}</div>
                                <div>Last Volume: {technicalInfo.last_volume}</div>
                            </div>
                            <div style={{ height: 500 }}>
                                {chartData ? <Line data={chartData} options={chartOptions} /> : <div>No chart data</div>}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <strong>Predictions:</strong>
                                <ul>
                                    {predictions.map((p, idx) => (
                                        <li key={idx}>{p.date} — ${p.predicted_close.toFixed(2)}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </>
            )}

            {activeTab === 'news' && (
                <div>
                    {newsLoading && <div>Loading news…</div>}
                    {!newsLoading && news.length === 0 && <div>No news available.</div>}
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {news.map((article, idx) => (
                            <li key={idx} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: darkMode ? '#90caf9' : '#1a0dab',
                                        fontWeight: 'bold',
                                        textDecoration: 'none',
                                    }}
                                >
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
                        <div>
                            <h3>{overview.name} ({overview.symbol})</h3>
                            <p>{overview.description}</p>
                            <p><strong>Sector:</strong> {overview.sector}</p>
                            <p><strong>Industry:</strong> {overview.industry}</p>
                            <p><strong>Market Cap:</strong> {overview.marketCap}</p>
                            <p>
                                <strong>Website:</strong>{' '}
                                <a href={overview.website} target="_blank" rel="noreferrer">
                                    {overview.website}
                                </a>
                            </p>
                        </div>
                    )}
                </div>
            )}

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