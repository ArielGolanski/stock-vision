const express = require("express")
const fs = require("fs")
const path = require("path");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Point to server/ml/ml_models regardless of CWD
    const baseDir = path.join(__dirname, "..", "ml", "ml_models");
    const allMetrics = [];

    if (!fs.existsSync(baseDir)) {
      return res.json([]);
    }

    // Go through each ticker directory
    const tickers = fs.readdirSync(baseDir);
    for (const ticker of tickers) {
      const tickerDir = path.join(baseDir, ticker, `${ticker}_enhanced_lstm`);
      if (!fs.existsSync(tickerDir)) continue;

      const files = fs.readdirSync(tickerDir).filter(f => f.endsWith("_metrics.json"));
      for (const file of files) {
        const filePath = path.join(tickerDir, file);
        try {
          const content = fs.readFileSync(filePath, "utf-8").trim();
          if (!content) continue; // skip empty file
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            allMetrics.push(...data);
          }
        } catch (err) {
          console.error(`⚠️ Error parsing ${file}:`, err.message);
        }
      }
    }

    res.json(allMetrics);
  } catch (err) {
    console.error("Error reading metrics:", err);
    res.status(500).json({ error: "Failed to read metrics" });
  }
});

module.exports = router;
