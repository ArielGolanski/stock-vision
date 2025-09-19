// server/routes/stockHistory.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const yf = require('yahoo-finance2').default;

// helpers
function mapRangeToStartDate(range) {
    const now = new Date();
    const start = new Date(now);
    switch (range) {
        case '10y': start.setFullYear(now.getFullYear() - 10); break;
        case '5y': start.setFullYear(now.getFullYear() - 5); break;
        case '3y': start.setFullYear(now.getFullYear() - 3); break;
        case '1y': start.setFullYear(now.getFullYear() - 1); break;
        case '6mo': start.setMonth(now.getMonth() - 6); break;
        case '1mo': start.setMonth(now.getMonth() - 1); break;
        case '1w': start.setDate(now.getDate() - 7); break;
        case '1d': start.setDate(now.getDate() - 1); break;
        default: start.setFullYear(now.getFullYear() - 10);
    }
    return start;
}

function formatDate(d) {
    if (!d) return null;
    return new Date(d).toISOString().slice(0, 10);
}

function addBusinessDays(dateStr, days) {
    const d = new Date(dateStr);
    let added = 0;
    while (added < days) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) added++;
    }
    return d;
}

router.get('/', async (req, res) => {
    try {
        const ticker = (req.query.ticker || '').trim().toUpperCase();
        const range = req.query.range || '10y';
        const predictionType = (req.query.predictionType || 'daily').toLowerCase();
        const predictionPeriods = parseInt(req.query.predictionPeriods || '5', 10);

        if (!ticker) return res.status(400).json({ error: 'Ticker is required' });

        const period1 = mapRangeToStartDate(range);
        const period2 = new Date();

        const queryOptions = { period1: formatDate(period1), period2: formatDate(period2), interval: '1d' };
        const raw = await yf.historical(ticker, queryOptions);

        if (!raw || raw.length === 0) {
            return res.status(404).json({ error: 'Ticker not found or no data available' });
        }

        const history = raw.map(item => ({
            date: formatDate(item.date),
            close: item.close === undefined ? null : Number(item.close),
            open: item.open === undefined ? null : Number(item.open),
            volume: item.volume === undefined ? null : Number(item.volume)
        }));

        const last = history[history.length - 1];
        const technical_info = {
            last_close: last ? last.close : null,
            last_open: last ? last.open : null,
            last_volume: last ? last.volume : null
        };

        // predictions via ML microservice
        let predictions = [];
        try {
            const mlTarget = predictionType === 'monthly' ? 'Monthly Change %' : 'Daily Change %';
            const mlResp = await axios.get(`http://localhost:8000/predict/${ticker}`, {
                params: { target: mlTarget, days: predictionPeriods }
            });

            console.log('ML response:', mlResp.data)
            const futurePrices = (mlResp.data && mlResp.data.future_prices) || [];
            const lastDate = history[history.length - 1].date;

            if (predictionType === 'daily') {
                for (let i = 1; i <= futurePrices.length; i++) {
                    const d = addBusinessDays(lastDate, i);
                    predictions.push({ date: formatDate(d), predicted_close: Number(futurePrices[i - 1]) });
                }
            } else {
                for (let i = 1; i <= futurePrices.length; i++) {
                    const d = new Date(lastDate);
                    d.setMonth(d.getMonth() + i);
                    predictions.push({ date: formatDate(d), predicted_close: Number(futurePrices[i - 1]) });
                }
            }
            predictions = predictions.slice(0, predictionPeriods);
        } catch (mlErr) {
            // if ML service is down, return empty predictions
            console.warn('ML service error:', mlErr && mlErr.message);
            predictions = [];
        }

        return res.json({ history, predictions, technical_info });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ticker not found or no data available' });
    }
});

module.exports = router;
