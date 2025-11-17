// StocksDashboard.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

import ChartTab from './ChartTab';
import RiskCalculatorTab from './RiskCalculatorTab'; 
import NewsTab from './NewsTab';
import OverviewTab from './OverviewTab';
import HypeMeterTab from './HypeMeterTab';
import DiscussionTab from './DiscussionTab';


import { LoadingSpinner } from './LoadingComponents'; 

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

export const periods = [
    { label: '1D', value: '1d', days: 1 },
    { label: '1W', value: '1w', days: 5 },
    { label: '1M', value: '1mo', days: 21 },
    { label: '6M', value: '6mo', days: 126 },
    { label: '1Y', value: '1y', days: 252 },
    { label: '3Y', value: '3y', days: 756 },
    { label: '5Y', value: '5y', days: 1260 },
    { label: '10Y', value: '10y', days: 2520 },
];

// ---------------------------------------------------------------------

export default function StocksDashboard() {
    const { darkMode } = useTheme();

    // --- State Management (All state remains in the parent) ---
    const [ticker, setTicker] = useState('MSFT');
    const [range, setRange] = useState('1y');
    const [predictionType, setPredictionType] = useState('daily');
    const [fullHistory, setFullHistory] = useState([]); 
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [technicalInfo, setTechnicalInfo] = useState({});
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null);
    const [periodChanges, setPeriodChanges] = useState({});
    const [activeTab, setActiveTab] = useState('chart');

    // News & Overview
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
    // -----------------------------------------------------------


    // --- Side Effects & Helper Functions (Remain in the parent) ---

    // Get current user ID and FETCH FEES from token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);

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

            } catch (err) {
                console.error('Error parsing token:', err);
            }
        }
    }, []);

    // Helper: get cutoff date by range
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

    // Fetch 10y history (primary data fetch)
    const fetchFullHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ ticker, range: '10y', predictionType });
            const resp = await fetch(`${API_URL}/api/stock-history?${params.toString()}`);
            if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${resp.status}`);
            }
            const json = await resp.json();
            setFullHistory(json.history || []);
            setPredictions(json.predictions || []);
            setTechnicalInfo(json.technical_info || {});

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
            setTechnicalInfo({});
        } finally {
            setLoading(false);
        }
    }, [ticker, predictionType]);

    // Slice full history based on selected range
    useEffect(() => {
        if (fullHistory.length > 0) {
            const cutoff = getCutoffDate(range);
            const filtered = fullHistory.filter(h => new Date(h.date) >= cutoff);
            setFilteredHistory(filtered);
        }
    }, [range, fullHistory]);

    // Secondary fetches
    const fetchNews = useCallback(async () => {
        setNewsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/stocks/news?ticker=${ticker}`);
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
            const res = await fetch(`${API_URL}/api/stocks/overview?ticker=${ticker}`);
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
            const res = await fetch(`${API_URL}/api/comments?ticker=${ticker}`);
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

    const fetchHypeData = useCallback(async () => {
        setHypeLoading(true);
        setHypeData(null);
        try {
            const res = await fetch(`${API_URL}/api/hypemeter?ticker=${ticker}&timeframe=${hypeTimeframe}`);
            if (!res.ok) throw new Error(`Failed to fetch hype data`);
            const json = await res.json();
            setHypeData(json);
        } catch (err) {
            console.error('Hype fetch error:', err);
        } finally {
            setHypeLoading(false);
        }
    }, [ticker, hypeTimeframe]);

    // Comment submission logic (kept in parent due to state dependencies)
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ticker, content: newComment })
            });
            if (!res.ok) {
                const errBody = await res.json();
                throw new Error(errBody.message || 'Failed to post comment');
            }
            setNewComment('');
            await fetchComments();
        } catch (err) {
            console.error('Comment submission error:', err);
            setCommentError(err.message);
        } finally {
            setSubmitting(false);
        }
    }, [newComment, ticker, fetchComments]);

    // Comment deletion logic (kept in parent due to state dependencies)
    const handleDeleteComment = useCallback(async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please log in to delete comments');
            }
            const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errBody = await res.json();
                throw new Error(errBody.message || 'Failed to delete comment');
            }
            await fetchComments();
        } catch (err) {
            console.error('Comment deletion error:', err);
            alert(err.message);
        }
    }, [fetchComments]);

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
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }

    // Initial and Ticker/Type dependent fetches
    useEffect(() => { fetchFullHistory(); }, [fetchFullHistory]);
    useEffect(() => { fetchNews(); fetchOverview(); fetchComments(); }, [fetchNews, fetchOverview, fetchComments]);
    useEffect(() => { fetchHypeData(); }, [fetchHypeData]);


    // --- Chart Data Memo (remains in the parent) ---
    const chartData = useMemo(() => {
        if (filteredHistory.length === 0) return null;
        const histData = filteredHistory.map(h => ({ x: h.date, y: h.close }));
        const predData = predictions.map(p => ({ x: p.date, y: p.predicted_close }));

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
                    tension: 0.2, pointRadius: 2, borderWidth: 2,
                    borderColor: darkMode ? 'rgba(100, 181, 246, 1)' : 'rgba(33, 133, 208, 1)',
                },
                {
                    label: 'Predicted Close',
                    data: predData,
                    tension: 0.2, pointRadius: 4, borderWidth: 2, borderDash: [8, 6],
                    borderColor: darkMode ? 'rgba(239, 83, 80, 1)' : 'rgba(220, 78, 65, 1)',
                },
            ],
        };
    }, [filteredHistory, predictions, darkMode]);

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: { mode: 'nearest', callbacks: { label: (context) => { const val = context.parsed.y; return `${context.dataset.label}: ${val != null ? val.toFixed(2) : 'N/A'}`; }, }, },
            legend: { position: 'top' },
        },
        scales: { x: { type: 'time', time: { unit: 'day', tooltipFormat: 'PPP' } }, y: { beginAtZero: false }, },
    };
    // ------------------------------------------------------------------


    // --- Main Render ---
    return (
        <>
            {/* Global Keyframes must be accessible to all components */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                @keyframes shimmer { to { left: 100%; } }
            `}</style>
        
            <div style={{ 
                padding: 20, 
                background: darkMode ? '#2e2e2eff' : '#fafafa', 
                color: darkMode ? '#f1f1f1' : '#111', 
                borderRadius: '8px' 
            }}>
                
                {/* ------------------- HEADER (Ticker & Prediction Type) ------------------- */}
                <h2 style={{ 
                    margin: '0 0 15px 0', 
                    borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`, 
                    paddingBottom: '10px' 
                }}>
                    Stocks Dashboard
                </h2>
                
                <div style={{ 
                    display: 'flex', 
                    gap: 20, 
                    marginBottom: 20,
                    alignItems: 'center'
                }}>
                    {/* Ticker Selector */}
                    <select 
                        value={ticker} 
                        onChange={(e) => setTicker(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                            color: darkMode ? '#f1f1f1' : '#111',
                            fontSize: '14px',
                            minWidth: '120px',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="MSFT">Microsoft</option>
                        <option value="AAPL">Apple</option>
                        <option value="T">AT&T</option>
                        <option value="IBM">IBM</option>
                    </select>

                    {/* Prediction Type Radio Buttons */}
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ color: darkMode ? '#bbb' : '#666' }}>Prediction Type:</span>
                        
                        {/* Daily */}
                        <label style={{ color: darkMode ? '#f1f1f1' : '#111', fontWeight: predictionType === 'daily' ? 'bold' : 'normal' }}>
                            <input type="radio" checked={predictionType === 'daily'} onChange={() => setPredictionType('daily')} style={{ marginRight: '5px' }}/> Daily
                        </label>

                        {/* Monthly */}
                        <label style={{ color: darkMode ? '#f1f1f1' : '#111', fontWeight: predictionType === 'monthly' ? 'bold' : 'normal' }}>
                            <input type="radio" checked={predictionType === 'monthly'} onChange={() => setPredictionType('monthly')} style={{ marginRight: '5px' }}/> Monthly
                        </label>
                    </div>
                </div>
                {/* ------------------- END HEADER ------------------- */}


                {/* Tab Navigation Buttons */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    {['chart', 'news', 'overview', 'discussion', 'hype',  'risk'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '6px 12px', borderRadius: '6px', border: activeTab === tab ? '2px solid #2196f3' : `1px solid ${darkMode ? '#555' : '#ccc'}`, background: activeTab === tab ? '#2196f3' : 'transparent', color: activeTab === tab ? '#fff' : darkMode ? '#f1f1f1' : '#111', cursor: 'pointer' }}>
                            {tab === 'hype' ? 'HypeMeter' : tab === 'risk' ? 'Risk Calculator' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ------------------- TAB CONTENT ------------------- */}
                
                {activeTab === 'chart' && (
                    <ChartTab
                        ticker={ticker}
                        error={error}
                        loading={loading}
                        filteredHistory={filteredHistory}
                        predictions={predictions}
                        technicalInfo={technicalInfo}
                        overview={overview}
                        range={range}
                        setRange={setRange}
                        periodChanges={periodChanges}
                        chartData={chartData}
                        chartOptions={chartOptions}
                    />
                )}
                
                {activeTab === 'risk' && (
                    <RiskCalculatorTab
                        technicalInfo={technicalInfo}
                        predictions={predictions}
                        investmentAmount={investmentAmount}
                        setInvestmentAmount={setInvestmentAmount}
                        loading={loading}
                        feesLoading={feesLoading}
                        userFees={userFees}
                        ticker={ticker}
                    />
                )}
                
                {activeTab === 'news' && (
                    <NewsTab
                        news={news}
                        newsLoading={newsLoading}
                    />
                )}

                {activeTab === 'overview' && (
                    <OverviewTab
                        overview={overview}
                        overviewLoading={overviewLoading}
                    />
                )}

                {activeTab === 'hype' && (
                    <HypeMeterTab
                        hypeData={hypeData}
                        hypeLoading={hypeLoading}
                        hypeTimeframe={hypeTimeframe}
                        setHypeTimeframe={setHypeTimeframe}
                    />
                )}

                {activeTab === 'discussion' && (
                    <DiscussionTab
                        ticker={ticker}
                        comments={comments}
                        commentsLoading={commentsLoading}
                        newComment={newComment}
                        setNewComment={setNewComment}
                        commentError={commentError}
                        submitting={submitting}
                        handleSubmitComment={handleSubmitComment}
                        handleDeleteComment={handleDeleteComment}
                        currentUserId={currentUserId}
                        formatDate={formatDate}
                    />
                )}

            </div>
        </>
    );
}