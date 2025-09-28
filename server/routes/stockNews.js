// server/routes/stocksNews.js
const express = require("express");
const router = express.Router();
const yf = require("yahoo-finance2").default;

// GET /api/stocks/news?ticker=MSFT
router.get("/news", async (req, res) => {
    try {
        const ticker = (req.query.ticker || "").trim().toUpperCase();
        if (!ticker) {
            return res.status(400).json({ error: "Ticker is required" });
        }

        // yahoo-finance2: fetch news
        const results = await yf.search(ticker, { newsCount: 10 });

        if (!results || !results.news || results.news.length === 0) {
            return res.json({ articles: [] });
        }

        const articles = results.news.map((n) => ({
            headline: n.title,
            url: n.link,
            source: n.publisher,
            date: new Date(n.providerPublishTime * 1000).toLocaleDateString(),
        }));

        res.json({ articles });
    } catch (err) {
        console.error("News route error:", err);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

module.exports = router;
