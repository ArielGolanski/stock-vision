const express = require('express');
const axios = require('axios');
const yf = require('yahoo-finance2').default;

const router = express.Router();

const ML_BASE_URL = process.env.ML_SERVICE_URL || (process.env.NODE_ENV === 'production' ? 'http://ml:8000' : 'http://localhost:8000');

// Fixed peers list per plan
const FIXED_PEERS = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','AVGO'];

async function fetchSector(symbol) {
  try {
    const data = await yf.quoteSummary(symbol, { modules: ['assetProfile'] });
    return (data && data.assetProfile && data.assetProfile.sector) || null;
  } catch (err) {
    return null;
  }
}

async function getSectorPeers(baseSymbol, universe) {
  const baseSector = await fetchSector(baseSymbol);
  if (!baseSector) return [];
  const peers = [];
  // Resolve in small batches to avoid rate limits
  for (const sym of universe) {
    if (sym === baseSymbol) continue;
    const sector = await fetchSector(sym);
    if (sector && sector === baseSector) peers.push(sym);
    if (peers.length >= 6) break; // keep it small
  }
  return peers;
}

async function backtestSymbol(symbol, windowDays, horizon) {
  const url = `${ML_BASE_URL}/backtest/${symbol}`;
  const { data } = await axios.get(url, { params: { window_days: windowDays, horizon, target: 'Daily Change %' } });
  return data;
}

router.get('/accuracy', async (req, res) => {
  try {
    const ticker = (req.query.ticker || 'AAPL').toUpperCase();
    const windowDays = parseInt(req.query.windowDays || '90', 10);
    const horizon = parseInt(req.query.horizon || '1', 10);
    const peersMode = (req.query.peers || 'fixed').toLowerCase();

    let peerSymbols = [];
    if (peersMode === 'sector') {
      const universe = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','AVGO','WMT','LLY','ORCL','V','MA','NFLX','TSLA'];
      peerSymbols = await getSectorPeers(ticker, universe);
      if (peerSymbols.length === 0) peerSymbols = FIXED_PEERS.filter(s => s !== ticker);
    } else {
      peerSymbols = FIXED_PEERS.filter(s => s !== ticker);
    }

    // Backtest base + peers (sequential with small concurrency to be safe)
    const base = await backtestSymbol(ticker, windowDays, horizon);
    const peers = [];
    for (const sym of peerSymbols) {
      try {
        const r = await backtestSymbol(sym, windowDays, horizon);
        peers.push({ ticker: sym, metrics: r.metrics });
      } catch (err) {
        // skip failed peer
      }
    }

    // External providers via ML mock endpoint for stable demo values
    let external = [];
    try {
      const { data: mock } = await axios.get(`${ML_BASE_URL}/providers/externals/${ticker}`, { params: { months: 12 } });
      external = Array.isArray(mock?.providers) ? mock.providers : [];
    } catch (e) {
      // ignore provider failure
    }

    // Comparison index: compare our directional vs avg external (0..100 centered ~50)
    let comparisonIndex = null;
    if (base?.metrics?.directionalAccuracy != null && external.length > 0) {
      const ours = Number(base.metrics.directionalAccuracy);
      const avgExternal = external.reduce((s, p) => s + Number(p.metrics?.directionalAccuracy || 0), 0) / external.length;
      let idx = Math.round((ours - avgExternal + 1) * 50);
      if (idx < 0) idx = 0;
      if (idx > 100) idx = 100;
      comparisonIndex = idx;
    }

    res.json({ base, peers, externalProviders: external, comparisonIndex });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute accuracy', details: err.message });
  }
});

module.exports = router;


