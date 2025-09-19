const express = require('express');
const axios = require('axios');

const router = express.Router();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Popular US stocks
const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AVGO', 'WMT', 'LLY', 'ORCL', 'V', 'MA', 'NFLX'];

// Helper to fetch quote from Finnhub with detailed logging
async function fetchQuote(symbol) {
  try {
    // console.log(`\n--- Fetching ${symbol} ---`);
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

    const res = await axios.get(url);
    // console.log(`${symbol} HTTP Status:`, res.status);
    // console.log(`${symbol} Raw Response:`, JSON.stringify(res.data, null, 2));

    const data = res.data;

    // Check for API errors
    if (data.error) {
      console.log(`${symbol} API Error:`, data.error);
      return null;
    }

    // Check if we have required fields
    if (!data.c || !data.pc || data.c === 0 || data.pc === 0) {
      console.log(`${symbol} Invalid data - Current: ${data.c}, Previous: ${data.pc}`);
      return null;
    }

    const percentChange = ((data.c - data.pc) / data.pc) * 100;
    const change = data.c - data.pc;

    const result = {
      symbol: symbol,
      price: data.c,
      change: change,
      percentChange: percentChange,
      previousClose: data.pc
    };

    // console.log(`${symbol} Processed:`, result);
    return result;

  } catch (err) {
    console.error(`${symbol} Error:`, err.message);
    if (err.response) {
      console.error(`${symbol} HTTP Status:`, err.response.status);
      console.error(`${symbol} Response:`, err.response.data);
    }
    return null;
  }
}

// GET /api/stocks/trending
router.get('/trending', async (req, res) => {
  try {

    const results = [];

    // Fetch quotes with delays
    for (let i = 0; i < symbols.length; i++) {
      const quote = await fetchQuote(symbols[i]);
      if (quote) {
        results.push(quote);
      }

      // Add delay between requests
      if (i < symbols.length - 1) {
        // console.log('Waiting 200ms...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    if (results.length === 0) {
      console.log('No valid results - returning error');
      return res.status(500).json({
        error: 'No stock data available',
        debug: {
          symbolsAttempted: symbols.length,
          validResults: 0,
          apiKeyConfigured: !!FINNHUB_API_KEY
        }
      });
    }

    // Sort by % change descending for gainers
    const gainers = [...results]
      .sort((a, b) => b.percentChange - a.percentChange)
      .slice(0, 5);

    // Sort by % change ascending for losers
    const losers = [...results]
      .sort((a, b) => a.percentChange - b.percentChange)
      .slice(0, 5);

    res.json({
      gainers,
      losers,
      debug: {
        totalSymbols: symbols.length,
        validResults: results.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Error in /trending:', err);
    res.status(500).json({
      error: 'Failed to fetch trending stocks',
      message: err.message
    });
  }
});

// Test endpoint to check single symbol
router.get('/test/:symbol', async (req, res) => {
  const { symbol } = req.params;
  console.log(`\n=== Testing single symbol: ${symbol} ===`);

  const result = await fetchQuote(symbol.toUpperCase());

  res.json({
    symbol: symbol,
    result: result,
    apiKeyConfigured: !!FINNHUB_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    apiKeyConfigured: !!FINNHUB_API_KEY,
    apiKeyLength: FINNHUB_API_KEY ? FINNHUB_API_KEY.length : 0,
    symbols: symbols,
    timestamp: new Date().toISOString()
  });
});

router.get('/predict/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { target, days } = req.query;

  try {
    const response = await axios.get(`http://localhost:8000/predict/${ticker}`, {
      params: { target: target || "Daily Change %", days: days || 5 }
    });
    console.log('Prediction response:', response.data)
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Prediction service unavailable", details: err.message });
  }
});

module.exports = router;