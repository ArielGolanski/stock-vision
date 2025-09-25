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
    const [dataPayload, setDataPayload] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [periodChanges, setPeriodChanges] = useState({});

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

    // fetch function
    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                ticker,
                range,
                predictionType,
            });
            const resp = await fetch(
                `http://localhost:5001/api/stock-history?${params.toString()}`
            );
            if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${resp.status}`);
            }
            const json = await resp.json();
            console.log('Fetch response:', json);
            setDataPayload(json);

            // Compute % changes for ALL periods
            if (json.history && json.history.length > 1) {
                const closes = json.history.map((h) => h.close);
                const newChanges = {};
                periods.forEach((p) => {
                    if (closes.length > 1) {
                        const index = Math.max(closes.length - p.days, 0);
                        const pastPrice = closes[index];
                        const lastPrice = closes[closes.length - 1];
                        if (pastPrice && lastPrice) {
                            const pct = ((lastPrice - pastPrice) / pastPrice) * 100;
                            newChanges[p.value] = pct;
                        }
                    }
                });
                setPeriodChanges(newChanges);
            }
        } catch (err) {
            setError(err.message);
            setDataPayload(null);
        } finally {
            setLoading(false);
        }
    }

    // Fetch whenever ticker/range/predictionType changes
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticker, range, predictionType]);

    const chartData = useMemo(() => {
        if (!dataPayload) return null;
        const hist = dataPayload.history || [];
        const preds = dataPayload.predictions || [];

        const histData = hist.map((h) => ({ x: h.date, y: h.close }));
        const predData = preds.map((p) => ({ x: p.date, y: p.predicted_close }));

        return {
            datasets: [
                {
                    label: 'Historical Close',
                    data: histData,
                    tension: 0.2,
                    pointRadius: 2,
                    borderWidth: 2,
                    borderColor: darkMode
                        ? 'rgba(100, 181, 246, 1)'
                        : 'rgba(33, 133, 208, 1)',
                },
                {
                    label: 'Predicted Close',
                    data: [...Array(hist.length).fill(null), ...predData],
                    tension: 0.2,
                    pointRadius: 4,
                    borderWidth: 2,
                    borderDash: [8, 6],
                    borderColor: darkMode
                        ? 'rgba(239, 83, 80, 1)'
                        : 'rgba(220, 78, 65, 1)',
                },
            ],
        };
    }, [dataPayload, darkMode]);

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                mode: 'nearest',
                callbacks: {
                    label: function (context) {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: $${val != null ? val.toFixed(2) : 'N/A'
                            }`;
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
        <div
            style={{
                padding: 20,
                background: darkMode ? '#121212' : '#fafafa',
                color: darkMode ? '#f1f1f1' : '#111',
                borderRadius: '8px',
            }}
        >
            <h2>Stocks Dashboard</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <select value={ticker} onChange={(e) => setTicker(e.target.value)}>
                    <option value="MSFT">Microsoft</option>
                    <option value="T">AT&T</option>
                    <option value="IBM">IBM</option>
                </select>

                <label>
                    <input
                        type="radio"
                        checked={predictionType === 'daily'}
                        onChange={() => setPredictionType('daily')}
                    />{' '}
                    Daily
                </label>
                <label>
                    <input
                        type="radio"
                        checked={predictionType === 'monthly'}
                        onChange={() => setPredictionType('monthly')}
                    />{' '}
                    Monthly
                </label>
            </div>

            {/* Range cubes */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {periods.map((p) => {
                    const isActive = range === p.value;
                    const pct = periodChanges[p.value];
                    const pctText =
                        pct !== undefined ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '';

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
                                    ? darkMode
                                        ? '#333'
                                        : '#e3f2fd'
                                    : darkMode
                                        ? '#1e1e1e'
                                        : '#fff',
                                border: isActive
                                    ? '2px solid #2196f3'
                                    : '1px solid rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div style={{ fontWeight: 'bold' }}>{p.label}</div>
                            <div
                                style={{
                                    fontSize: '12px',
                                    color:
                                        pct > 0
                                            ? '#059669'
                                            : pct < 0
                                                ? '#dc2626'
                                                : darkMode
                                                    ? '#aaa'
                                                    : '#666',
                                }}
                            >
                                {pctText}
                            </div>
                        </div>
                    );
                })}
            </div>

            {error && <div style={{ color: 'red' }}>Error: {error}</div>}

            {dataPayload && (
                <div>
                    <div style={{ marginBottom: 12 }}>
                        <strong>Technical Info:</strong>
                        <div>Last Close: ${dataPayload.technical_info.last_close}</div>
                        <div>Last Open: ${dataPayload.technical_info.last_open}</div>
                        <div>Last Volume: {dataPayload.technical_info.last_volume}</div>
                    </div>

                    <div style={{ height: 500 }}>
                        {chartData ? (
                            <Line data={chartData} options={chartOptions} />
                        ) : (
                            <div>No chart data</div>
                        )}
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <strong>Predictions:</strong>
                        <ul>
                            {(dataPayload.predictions || []).map((p, idx) => (
                                <li key={idx}>
                                    {p.date} — ${p.predicted_close.toFixed(2)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {loading && <div>Loading…</div>}
        </div>
    );
}
