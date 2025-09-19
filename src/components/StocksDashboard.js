// client/src/components/StocksDashboard.js
import React, { useState, useEffect } from 'react';
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
    Title
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend, Title);

export default function StocksDashboard() {
    const [ticker, setTicker] = useState('MSFT');
    const [range, setRange] = useState('1y');
    const [predictionType, setPredictionType] = useState('daily');
    const [dataPayload, setDataPayload] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // fetch function
    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                ticker,
                range,
                predictionType
            });
            const resp = await fetch(`http://localhost:5001/api/stock-history?${params.toString()}`);
            if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${resp.status}`);
            }
            const json = await resp.json();
            console.log('Fetch response:', json)
            setDataPayload(json);
        } catch (err) {
            setError(err.message);
            setDataPayload(null);
        } finally {
            setLoading(false);
        }
    }

    // Run once on mount (no warning now)
    useEffect(() => {
        (async () => {
            await fetchData();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const chartData = React.useMemo(() => {
        if (!dataPayload) return null;
        const hist = dataPayload.history || [];
        const preds = dataPayload.predictions || [];

        // Historical data
        const histData = hist.map(h => ({ x: h.date, y: h.close }));

        // Predictions should continue after history
        const predData = preds.map(p => ({ x: p.date, y: p.predicted_close }));

        return {
            datasets: [
                {
                    label: 'Historical Close',
                    data: histData,
                    tension: 0.2,
                    pointRadius: 2,
                    borderWidth: 2,
                    borderColor: 'rgba(33, 133, 208, 1)'
                },
                {
                    label: 'Predicted Close',
                    data: [...histData.slice(-1), ...predData], // start from last hist point
                    tension: 0.2,
                    pointRadius: 4,
                    borderWidth: 2,
                    borderDash: [8, 6],
                    borderColor: 'rgba(220, 78, 65, 1)'
                }
            ]
        };
    }, [dataPayload]);


    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                mode: 'nearest',
                callbacks: {
                    label: function (context) {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: $${val != null ? val.toFixed(2) : 'N/A'}`;
                    }
                }
            },
            legend: { position: 'top' }
        },
        scales: {
            x: { type: 'time', time: { unit: 'day', tooltipFormat: 'PPP' } },
            y: { beginAtZero: false }
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>Stocks Dashboard</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <select value={ticker} onChange={e => setTicker(e.target.value)}>
                    <option value="MSFT">Microsoft</option>
                    <option value="T">AT&T</option>
                    <option value="IBM">IBM</option>
                </select>
                <select value={range} onChange={e => setRange(e.target.value)}>
                    <option value="10y">10y</option>
                    <option value="5y">5y</option>
                    <option value="3y">3y</option>
                    <option value="1y">1y</option>
                    <option value="6mo">6mo</option>
                    <option value="1mo">1mo</option>
                    <option value="1w">1w</option>
                    <option value="1d">1d</option>
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


                <button onClick={fetchData} disabled={loading}>Get Data</button>
            </div>

            {error && <div style={{ color: 'red' }}>Error: {error}</div>}

            {
                dataPayload && (
                    <div>
                        <div style={{ marginBottom: 12 }}>
                            <strong>Technical Info:</strong>
                            <div>Last Close: ${dataPayload.technical_info.last_close}</div>
                            <div>Last Open: ${dataPayload.technical_info.last_open}</div>
                            <div>Last Volume: {dataPayload.technical_info.last_volume}</div>
                        </div>

                        <div style={{ height: 500 }}>
                            {chartData ? <Line data={chartData} options={chartOptions} /> : <div>No chart data</div>}
                        </div>

                        <div style={{ marginTop: 12 }}>
                            <strong>Predictions:</strong>
                            <ul>
                                {(dataPayload.predictions || []).map((p, idx) => (
                                    <li key={idx}>{p.date} — ${p.predicted_close.toFixed(2)}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )
            }

            {loading && <div>Loading…</div>}
        </div >
    );
}
