// server/routes/stockHistory.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const ML_BASE_URL = process.env.ML_SERVICE_URL || (process.env.NODE_ENV === 'production' ? 'http://ml:8000' : 'http://localhost:8000');

// Proxy route: merges FastAPI stock-history + prediction endpoints
router.get("/", async (req, res) => {
    try {
        const ticker = (req.query.ticker || "").trim().toUpperCase();
        const range = req.query.range || "10y";
        console.log("Recieved stock history request for:", req.query.range);
        console.log("Range is set to:", range)
        const predictionType = (req.query.predictionType || "daily").toLowerCase();
        const predictionPeriods = parseInt(req.query.predictionPeriods || "5", 10);

        if (!ticker) {
            return res.status(400).json({ error: "Ticker is required" });
        }

        // 1. Get history + stock info from FastAPI
        let stockData;
        try {
            const stockResp = await axios.get(`${ML_BASE_URL}/api/stock-history`, {
                params: { ticker, range, predictionType, predictionPeriods },
            });
            stockData = stockResp.data;
        } catch (mlErr) {
            const status = mlErr.response?.status || 502;
            const details = mlErr.response?.data || { error: mlErr.message };
            console.error("ML /api/stock-history error:", status, details);
            return res.status(status).json({ error: "ML service error", details });
        }



        if (!stockData || stockData.error) {
            return res.status(404).json({ error: stockData.error || "No data found" });
        }

        // 2. Get predictions from FastAPI /predict/{ticker}
        let predictions = [];
        try {
            const mlTarget = predictionType === "monthly" ? "Monthly Change %" : "Daily Change %";
            console.log("ML base URL is set to:", ML_BASE_URL);
            console.log("Ticker is: ", ticker);
            const mlResp = await axios.get(`${ML_BASE_URL}/predict/${ticker}`, {
                params: { target: mlTarget, days: predictionPeriods, period: range },
            });

            // Expect FastAPI to return { future_prices: [...] }
            const futurePrices = mlResp.data?.future_prices || [];
            const lastDate = stockData.history[stockData.history.length - 1]?.date;

            if (lastDate && futurePrices.length > 0) {
                const addBusinessDays = (dateStr, days) => {
                    const d = new Date(dateStr);
                    let added = 0;
                    while (added < days) {
                        d.setDate(d.getDate() + 1);
                        const day = d.getDay();
                        if (day !== 0 && day !== 6) added++;
                    }
                    return d;
                };

                if (predictionType === "daily") {
                    for (let i = 1; i <= futurePrices.length; i++) {
                        const d = addBusinessDays(lastDate, i);
                        predictions.push({
                            date: d.toISOString().slice(0, 10),
                            predicted_close: Number(futurePrices[i - 1]),
                        });
                    }
                } else {
                    for (let i = 1; i <= futurePrices.length; i++) {
                        const d = new Date(lastDate);
                        d.setMonth(d.getMonth() + i);
                        predictions.push({
                            date: d.toISOString().slice(0, 10),
                            predicted_close: Number(futurePrices[i - 1]),
                        });
                    }
                }
            }
        } catch (mlErr) {
            console.warn("ML service error:", mlErr.message);
            predictions = [];
        }

        // 3. Merge into final response
        return res.json({
            history: stockData.history || [],
            technical_info: stockData.technical_info || {},
            stock_info: stockData.stock_info || {},
            predictions,
        });
    } catch (err) {
        const fallbackDetails = err.response?.data || { error: err.message };
        console.error("Proxy error:", err.message, fallbackDetails);
        return res.status(500).json({ error: "Failed to fetch data from ML service", details: fallbackDetails });
    }
});

module.exports = router;
