const express = require('express');
const axios = require('axios');
const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://ml:8000';
const yf = require("yahoo-finance2").default;
const router = express.Router();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// --- Cache ---
const cache = {
  news: new Map(),      // ticker -> { data, timestamp }
  overview: new Map()   // ticker -> { data, timestamp }
};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

function getFromCache(map, key) {
  const entry = map.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}
function setCache(map, key, data) {
  map.set(key, { data, timestamp: Date.now() });
}

// --- Popular US stocks ---
const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AVGO', 'WMT', 'LLY', 'ORCL', 'V', 'MA', 'NFLX', 'IBM', 'T'];

// --- Helper: Finnhub quote ---
async function fetchQuote(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const res = await axios.get(url);
    const data = res.data;

    if (!data.c || !data.pc || data.c === 0 || data.pc === 0) return null;

    const percentChange = ((data.c - data.pc) / data.pc) * 100;
    const change = data.c - data.pc;

    return { symbol, price: data.c, change, percentChange, previousClose: data.pc };
  } catch (err) {
    console.error(`${symbol} Error:`, err.message);
    return null;
  }
}

// --- Trending ---
router.get('/trending', async (req, res) => {
  try {
    const results = [];

    for (let i = 0; i < symbols.length; i++) {
      const quote = await fetchQuote(symbols[i]);
      if (quote) results.push(quote);
      if (i < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // avoid rate limits
      }
    }

    if (results.length === 0) {
      return res.status(500).json({
        error: 'No stock data available',
        debug: { symbolsAttempted: symbols.length, validResults: 0, apiKeyConfigured: !!FINNHUB_API_KEY }
      });
    }

    const gainers = [...results].sort((a, b) => b.percentChange - a.percentChange).slice(0, 5);
    const losers = [...results].sort((a, b) => a.percentChange - b.percentChange).slice(0, 5);

    res.json({
      gainers,
      losers,
      debug: { totalSymbols: symbols.length, validResults: results.length, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Error in /trending:', err);
    res.status(500).json({ error: 'Failed to fetch trending stocks', message: err.message });
  }
});

// --- Test single symbol ---
router.get('/test/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const result = await fetchQuote(symbol.toUpperCase());
  res.json({ symbol, result, apiKeyConfigured: !!FINNHUB_API_KEY, timestamp: new Date().toISOString() });
});

// --- Health check ---
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    apiKeyConfigured: !!FINNHUB_API_KEY,
    apiKeyLength: FINNHUB_API_KEY ? FINNHUB_API_KEY.length : 0,
    symbols,
    timestamp: new Date().toISOString()
  });
});

// --- Predictions ---
router.get('/predict/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { target, days } = req.query;
  try {
    const response = await axios.get(`${ML_BASE_URL}/predict/${ticker}`, {
      params: { target: target || "Daily Change %", days: days || 5 }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Prediction service unavailable", details: err.message });
  }
});

// --- News ---
router.get("/news", async (req, res) => {
  try {
    const ticker = (req.query.ticker || "").trim().toUpperCase();
    if (!ticker) return res.status(400).json({ error: "Ticker is required" });

    const cached = getFromCache(cache.news, ticker);
    if (cached) return res.json({ articles: cached, cached: true });

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

    setCache(cache.news, ticker, articles);
    res.json({ articles, cached: false });
  } catch (err) {
    console.error("News route error:", err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// --- Overview ---
router.get("/overview", async (req, res) => {
  try {
    const ticker = (req.query.ticker || "").trim().toUpperCase();
    if (!ticker) return res.status(400).json({ error: "Ticker is required" });

    const cached = getFromCache(cache.overview, ticker);
    if (cached) return res.json({ ...cached, cached: true });

    const data = await yf.quoteSummary(ticker, { modules: ["assetProfile", "price", "summaryDetail"] });
    const profile = data.assetProfile || {};
    const price = data.price || {};
    const summary = data.summaryDetail || {};

    const overview = {
      symbol: ticker,
      name: price.longName || price.shortName || ticker,
      description: profile.longBusinessSummary || "No description available",
      sector: profile.sector || "N/A",
      industry: profile.industry || "N/A",
      marketCap: summary.marketCap ? summary.marketCap.fmt : "N/A",
      website: profile.website || null,
    };

    setCache(cache.overview, ticker, overview);
    res.json({ ...overview, cached: false });
  } catch (err) {
    console.error("Overview route error:", err);
    res.status(500).json({ error: "Failed to fetch stock overview" });
  }
});

module.exports = router;
