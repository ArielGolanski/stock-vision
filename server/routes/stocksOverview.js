// routes/stocksOverview.js
const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance2").default;

// GET /api/stocks/overview?ticker=MSFT
router.get("/overview", async (req, res) => {
    try {
        const { ticker } = req.query;
        if (!ticker) {
            return res.status(400).json({ error: "Ticker is required" });
        }

        const result = await yahooFinance.quoteSummary(ticker, {
            modules: ["assetProfile", "price", "summaryDetail"],
        });

        if (!result) {
            return res.status(404).json({ error: "No data found" });
        }

        const profile = result.assetProfile || {};
        const price = result.price || {};
        const summary = result.summaryDetail || {};

        res.json({
            symbol: ticker,
            name: price.longName || price.shortName || ticker,
            description: profile.longBusinessSummary || "No description available",
            sector: profile.sector || "N/A",
            industry: profile.industry || "N/A",
            marketCap: summary.marketCap ? summary.marketCap.fmt : "N/A",
            website: profile.website || null,
        });
    } catch (err) {
        console.error("Error fetching overview:", err);
        res.status(500).json({ error: "Failed to fetch stock overview" });
    }
});

module.exports = router;
