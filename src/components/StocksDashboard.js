// client/src/components/StocksDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
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
} from "chart.js";
import "chartjs-adapter-date-fns";
import { useTheme } from "./ThemeContext";
import stockInfo from "./stockInfo";

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
    const [ticker, setTicker] = useState("MSFT");
    const [range, setRange] = useState("1y");
    const [predictionType, setPredictionType] = useState("daily");
    const [dataPayload, setDataPayload] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { darkMode } = useTheme();

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ ticker, range, predictionType });
            const resp = await fetch(
                `http://localhost:5001/api/stock-history?${params.toString()}`
            );
            if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP ${resp.status}`);
            }
            const json = await resp.json();
            setDataPayload(json);
        } catch (err) {
            setError(err.message);
            setDataPayload(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticker, range, predictionType]);

    // Chart data
    const chartData = useMemo(() => {
        if (!dataPayload) return null;
        const hist = dataPayload.history || [];
        const preds = dataPayload.predictions || [];

        const histData = hist.map((h) => ({ x: h.date, y: h.close }));
        const predData = preds.map((p) => ({ x: p.date, y: p.predicted_close }));

        return {
            datasets: [
                {
                    label: "Historical Close",
                    data: histData,
                    tension: 0.2,
                    pointRadius: 2,
                    borderWidth: 2,
                    borderColor: darkMode ? "#4CC9F0" : "#2185D0",
                },
                {
                    label: "Predicted Close",
                    data: [...histData.slice(-1), ...predData],
                    tension: 0.2,
                    pointRadius: 5,
                    borderWidth: 2,
                    borderDash: [6, 6],
                    borderColor: darkMode ? "#F72585" : "#DC4E41",
                },
            ],
        };
    }, [dataPayload, darkMode]);

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                mode: "nearest",
                callbacks: {
                    label: function (context) {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: $${val != null ? val.toFixed(2) : "N/A"
                            }`;
                    },
                },
            },
            legend: {
                position: "top",
                labels: { color: darkMode ? "#f1f1f1" : "#111" },
            },
        },
        scales: {
            x: {
                type: "time",
                time: { unit: "day", tooltipFormat: "PPP" },
                ticks: { color: darkMode ? "#ddd" : "#333" },
                grid: { color: darkMode ? "#444" : "#eee" },
            },
            y: {
                beginAtZero: false,
                ticks: { color: darkMode ? "#ddd" : "#333" },
                grid: { color: darkMode ? "#444" : "#eee" },
            },
        },
    };

    // Calculate % changes for range cards
    function calculateChange(hist, periodDays) {
        if (!hist.length) return null;
        const last = hist[hist.length - 1].close;
        let ref;

        if (periodDays === "All") {
            ref = hist[0].close;
        } else if (periodDays === "YTD") {
            const yearStart = new Date(new Date().getFullYear(), 0, 1);
            const refEntry = hist.find((h) => new Date(h.date) >= yearStart);
            ref = refEntry ? refEntry.close : hist[0].close;
        } else {
            const days =
                periodDays === "1d"
                    ? 1
                    : periodDays === "5d"
                        ? 5
                        : periodDays === "1m"
                            ? 21
                            : periodDays === "6m"
                                ? 126
                                : periodDays === "1y"
                                    ? 252
                                    : periodDays === "5y"
                                        ? 252 * 5
                                        : hist.length;
            const idx = Math.max(0, hist.length - days - 1);
            ref = hist[idx].close;
        }

        return ((last - ref) / ref) * 100;
    }

    const ranges = ["1d", "5d", "1m", "6m", "1y", "5y", "YTD", "All"];
    const hist = dataPayload?.history || [];

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: darkMode ? "#1e1e1e" : "#f9f9f9",
                color: darkMode ? "#f1f1f1" : "#111",
                padding: 20,
            }}
        >
            <h2>
                {stockInfo[ticker].name} ({ticker})
            </h2>

            {/* Range Cards */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                {ranges.map((r) => {
                    const change = calculateChange(hist, r);
                    if (change == null) return null;
                    const isPositive = change >= 0;
                    return (
                        <div
                            key={r}
                            style={{
                                flex: "1 0 100px",
                                padding: "12px",
                                borderRadius: "8px",
                                textAlign: "center",
                                background: darkMode ? "#2b2b2b" : "#fff",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            }}
                        >
                            <div>{r}</div>
                            <div
                                style={{
                                    color: isPositive ? "limegreen" : "crimson",
                                    fontWeight: "bold",
                                }}
                            >
                                {isPositive ? "▲" : "▼"} {change.toFixed(2)}%
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 20,
                    background: darkMode ? "#2b2b2b" : "#fff",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
            >
                <select
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    style={{ padding: 6 }}
                >
                    <option value="MSFT">Microsoft</option>
                    <option value="T">AT&T</option>
                    <option value="IBM">IBM</option>
                </select>
                <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    style={{ padding: 6 }}
                >
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
                        checked={predictionType === "daily"}
                        onChange={() => setPredictionType("daily")}
                    />{" "}
                    Daily
                </label>
                <label>
                    <input
                        type="radio"
                        checked={predictionType === "monthly"}
                        onChange={() => setPredictionType("monthly")}
                    />{" "}
                    Monthly
                </label>
            </div>

            {error && <div style={{ color: "red", marginBottom: 12 }}>Error: {error}</div>}

            {/* Key Data Points */}
            {dataPayload && (
                <div
                    style={{
                        background: darkMode ? "#2b2b2b" : "#fff",
                        padding: 16,
                        borderRadius: 10,
                        marginBottom: 20,
                    }}
                >
                    <h3>Key Data Points</h3>
                    <div>Previous Close: {dataPayload.technical_info.last_close}</div>
                    <div>Open: {dataPayload.technical_info.last_open}</div>
                    <div>Volume: {dataPayload.technical_info.last_volume}</div>
                    <div>Day’s Range: (to be filled from API if available)</div>
                </div>
            )}

            {/* About Section */}
            <div
                style={{
                    background: darkMode ? "#2b2b2b" : "#fff",
                    padding: 16,
                    borderRadius: 10,
                    marginBottom: 20,
                }}
            >
                <h3>About {stockInfo[ticker].name}</h3>
                <p>{stockInfo[ticker].about}</p>
            </div>

            {/* Chart */}
            <div
                style={{
                    background: darkMode ? "#2b2b2b" : "#fff",
                    padding: 16,
                    borderRadius: "10px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    marginBottom: 20,
                }}
            >
                <div style={{ height: 500 }}>
                    {chartData ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <div>No chart data</div>
                    )}
                </div>
            </div>

            {/* Predictions */}
            {dataPayload && (
                <div
                    style={{
                        background: darkMode ? "#2b2b2b" : "#fff",
                        padding: 16,
                        borderRadius: "10px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                >
                    <h3>Predictions</h3>
                    <ul>
                        {(dataPayload.predictions || []).map((p, idx) => (
                            <li key={idx}>
                                {p.date} — ${p.predicted_close.toFixed(2)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
