const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// --- Security Whitelists ---
// Only allow known tickers and types to prevent directory traversal attacks
const ALLOWED_TICKERS = ['AAPL', 'MSFT', 'IBM', 'T'];
const ALLOWED_TYPES = ['daily', 'monthly'];

router.get("/", async (req, res) => {
  try {
    // 1. Get and validate query parameters
    const { ticker, type } = req.query;

    if (!ticker || !ALLOWED_TICKERS.includes(ticker)) {
      return res.status(400).json({ error: "Invalid or missing 'ticker' parameter." });
    }
    
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing 'type' parameter." });
    }

    // 2. Construct the specific file path
    // e.g., "ml/ml_models/AAPL/AAPL_enhanced_lstm/daily_metrics.json"
    const baseDir = path.join(process.cwd(), "ml/ml_models");
    const tickerDir = path.join(baseDir, ticker, `${ticker}_enhanced_lstm`);
    const fileName = `${type}_metrics.json`; // Use the 'type' to find the file
    const filePath = path.join(tickerDir, fileName);

    let metrics = [];

    // 3. Read the specific metrics file
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      
      if (content) {
        try {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            metrics = data;
          }
        } catch (err) {
          console.error(`⚠️ Error parsing ${filePath}:`, err.message);
          // File is corrupt or not valid JSON, send empty array
        }
      }
    } else {
      console.warn(`Metrics file not found: ${filePath}`);
      // It's not an error if the file doesn't exist, just means no data.
      // The frontend will correctly show "No accuracy data found".
    }

    // 4. Sort the results (newest first)
    // The frontend assumes metrics[0] is the latest, so we must sort.
    metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(metrics);
    
  } catch (err) {
    console.error("Error reading metrics:", err);
    res.status(500).json({ error: "Failed to read metrics" });
  }
});

module.exports = router;