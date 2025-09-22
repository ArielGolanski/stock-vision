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

    const [ticker, setTicker] = useState("MSFT");
    const [period, setPeriod] = useState("1y");
    const [predictionType, setPredictionType] = useState("daily");
    const [dataPayload, setDataPayload] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [periodChanges, setPeriodChanges] = useState({});

    const periods = [
        { value: "1d", label: "1D", days: 1 },
        { value: "5d", label: "5D", days: 5 },
        { value: "1mo", label: "1M", days: 21 },
        { value: "6mo", label: "6M", days: 126 },
        { value: "1y", label: "1Y", days: 252 },
        { value: "5y", label: "5Y", days: 1260 },
        { value: "10y", label: "10Y", days: 2520 },
    ];

    // Stock descriptions & key stats
    const stockInfo = {
        MSFT: {
            name: "Microsoft Corporation",
            description:
                "Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide. Its segments include Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.",
            stats: {
                "Market Cap": "3.0T",
                "P/E Ratio": "35.6",
                "Dividend Yield": "0.8%",
                "52W Range": "280.00 - 420.00",
            },
        },
        T: {
            name: "AT&T Inc.",
            description:
                "AT&T provides telecommunications, media, and technology services. It offers wireless communications, broadband, pay television, and digital entertainment services globally.",
            stats: {
                "Market Cap": "120B",
                "P/E Ratio": "7.9",
                "Dividend Yield": "5.8%",
                "52W Range": "13.00 - 20.00",
            },
        },
        IBM: {
            name: "International Business Machines",
            description:
                "IBM provides integrated solutions and services worldwide. It operates in Cloud & Cognitive Software, Global Business Services, Systems, and Global Financing.",
            stats: {
                "Market Cap": "170B",
                "P/E Ratio": "22.1",
                "Dividend Yield": "4.5%",
                "52W Range": "115.00 - 175.00",
            },
        },
    };

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                ticker,
                period,
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
            setDataPayload(json);

            // Compute % changes for ALL periods
            if (json.history && json.history.length > 1) {
                const closes = json.history.map((h) => h.close);
                const newChanges = {};
                periods.forEach((p) => {
                    if (closes.length > p.days) {
                        const pastPrice = closes[closes.length - p.days] ?? closes[0];
                        const lastPrice = closes[closes.length - 1];
                        const pct = ((lastPrice - pastPrice) / pastPrice) * 100;
                        newChanges[p.value] = pct;
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

    useEffect(() => {
        (async () => {
            await fetchData();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticker, period, predictionType]);

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
                    borderColor: "rgba(33, 133, 208, 1)",
                },
                {
                    label: "Predicted Close",
                    data: [...histData.slice(-1), ...predData],
                    tension: 0.2,
                    pointRadius: 4,
                    borderWidth: 2,
                    borderDash: [8, 6],
                    borderColor: "rgba(220, 78, 65, 1)",
                },
            ],
        };
    }, [dataPayload]);

    const chartOptions = {
        responsive: true,
        plugins: {
            tooltip: {
                mode: "nearest",
                callbacks: {
                    label: function (context) {
                        const val = context.parsed.y;
                        return `${context.dataset.label}: $${val != null ? val.toFixed(2) : "N/A"}`;
                    },
                },
            },
            legend: { position: "top" },
        },
        scales: {
            x: {
                type: "time",
                time: { unit: "day", tooltipFormat: "PPP" },
                grid: { color: darkMode ? "#444" : "#ddd" },
            },
            y: {
                beginAtZero: false,
                grid: { color: darkMode ? "#444" : "#ddd" },
            },
        },
    };

    return (
        <div
            style={{
                padding: 20,
                background: darkMode ? "#121212" : "#fafafa",
                color: darkMode ? "#f1f1f1" : "#111",
                minHeight: "100vh",
            }}
        >
            <h2 style={{ marginBottom: 20 }}>Stocks Dashboard</h2>

            {/* Stock Info */}
            <div
                style={{
                    marginBottom: 20,
                    padding: 16,
                    borderRadius: 8,
                    background: darkMode ? "#1e1e1e" : "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <h3>{stockInfo[ticker].name}</h3>
                <p style={{ fontSize: "0.9em", opacity: 0.85 }}>
                    {stockInfo[ticker].description}
                </p>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 10,
                        marginTop: 10,
                    }}
                >
                    {Object.entries(stockInfo[ticker].stats).map(([key, val]) => (
                        <div
                            key={key}
                            style={{
                                padding: "8px 10px",
                                borderRadius: 6,
                                background: darkMode ? "#2a2a2a" : "#f5f5f5",
                            }}
                        >
                            <div style={{ fontSize: "0.8em", opacity: 0.7 }}>{key}</div>
                            <div style={{ fontWeight: "bold" }}>{val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ticker selector */}
            <div style={{ marginBottom: 16 }}>
                <select
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 6 }}
                >
                    <option value="MSFT">Microsoft</option>
                    <option value="T">AT&T</option>
                    <option value="IBM">IBM</option>
                </select>
            </div>

            {/* Period cubes */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 20,
                    flexWrap: "wrap",
                }}
            >
                {periods.map((p) => {
                    const pct = periodChanges[p.value];
                    const pctText =
                        pct !== undefined
                            ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
                            : "...";
                    return (
                        <div
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            style={{
                                cursor: "pointer",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                minWidth: "70px",
                                textAlign: "center",
                                border:
                                    period === p.value
                                        ? "2px solid #2185d0"
                                        : darkMode
                                            ? "1px solid #444"
                                            : "1px solid #ccc",
                                background:
                                    period === p.value
                                        ? "#2185d0"
                                        : darkMode
                                            ? "#1e1e1e"
                                            : "#f9f9f9",
                                color: period === p.value ? "#fff" : "inherit",
                                fontWeight: period === p.value ? "bold" : "normal",
                            }}
                        >
                            {p.label}
                            <div
                                style={{
                                    fontSize: "0.8em",
                                    marginTop: 4,
                                    color:
                                        pct === undefined
                                            ? "gray"
                                            : pct >= 0
                                                ? "#21ba45"
                                                : "#db2828",
                                }}
                            >
                                {pctText}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Prediction type */}
            <div style={{ marginBottom: 16 }}>
                <label style={{ marginRight: 8 }}>
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

            {error && <div style={{ color: "red" }}>Error: {error}</div>}

            {dataPayload && (
                <div>
                    {/* Technical info */}
                    <div style={{ marginBottom: 20 }}>
                        <strong>Technical Info:</strong>
                        <div>Last Close: ${dataPayload.technical_info.last_close}</div>
                        <div>Last Open: ${dataPayload.technical_info.last_open}</div>
                        <div>Last Volume: {dataPayload.technical_info.last_volume}</div>
                    </div>

                    {/* Chart */}
                    <div style={{ height: 500 }}>
                        {chartData ? (
                            <Line data={chartData} options={chartOptions} />
                        ) : (
                            <div>No chart data</div>
                        )}
                    </div>

                    {/* Predictions list */}
                    <div style={{ marginTop: 20 }}>
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
