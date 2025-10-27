const express = require("express");
const router = express.Router();
const axios = require("axios");
const ML_BASE_URL = process.env.ML_SERVICE_URL || (process.env.NODE_ENV === 'production' ? 'http://ml:8000' : 'http://localhost:8000');

// Get competitor predictions data
router.get("/", async (req, res) => {
  try {
    const ticker = (req.query.ticker || "").trim().toUpperCase();
    const predictionType = (req.query.type || "daily").toLowerCase();

    if (!ticker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    // Get prediction from our ML model
    let ourModelPrediction = null;
    try {
      const target = predictionType === "monthly" ? "Monthly Change %" : "Daily Change %";
      const mlResp = await axios.get(`${ML_BASE_URL}/predict/${ticker}`, {
        params: { target, days: 1 },
      });

      const futurePrices = mlResp.data?.future_prices || [];
      const futureChanges = mlResp.data?.future_changes || [];

      if (futurePrices.length > 0 && futureChanges.length > 0) {
        const price = futurePrices[0];
        const change = futureChanges[0];
        ourModelPrediction = {
          price: price,
          change: change,
          direction: change > 0 ? 'up' : 'down'
        };
      }
    } catch (mlErr) {
      console.warn("ML service error:", mlErr.message);
      return res.status(500).json({ 
        error: "Failed to fetch predictions from ML service",
        details: mlErr.message 
      });
    }

    // Mock competitor data (for demonstration purposes)
    // In a real application, you would integrate with actual competitor APIs
    const competitorData = {
      wallStreetZen: generateMockCompetitorData('wallStreetZen', ticker, predictionType),
      yahooFinance: generateMockCompetitorData('yahooFinance', ticker, predictionType)
    };

    // Get current stock price to calculate percent change for competitors
    let currentPrice = null;
    try {
      const priceResp = await axios.get(`${ML_BASE_URL}/api/stock-history`, {
        params: { ticker, range: '1mo', predictionType: 'daily' },
      });
      const history = priceResp.data?.history || [];
      if (history.length > 0) {
        currentPrice = history[history.length - 1].close;
      }
    } catch (err) {
      console.warn("Failed to fetch current price:", err.message);
    }

    // Adjust competitor prices to be relative to our prediction
    if (currentPrice && ourModelPrediction) {
      const priceDiff = ourModelPrediction.price - currentPrice;
      
      // WallStreetZen: slightly different price
      competitorData.wallStreetZen.price = ourModelPrediction.price - (priceDiff * 0.1);
      competitorData.wallStreetZen.change = ((competitorData.wallStreetZen.price - currentPrice) / currentPrice) * 100;
      
      // Yahoo Finance: different price
      competitorData.yahooFinance.price = ourModelPrediction.price + (priceDiff * 0.05);
      competitorData.yahooFinance.change = ((competitorData.yahooFinance.price - currentPrice) / currentPrice) * 100;
    }

    res.json({
      ourModel: ourModelPrediction,
      wallStreetZen: competitorData.wallStreetZen,
      yahooFinance: competitorData.yahooFinance
    });

  } catch (err) {
    console.error("Error fetching competitor predictions:", err.message);
    res.status(500).json({ error: "Failed to fetch competitor predictions", details: err.message });
  }
});

// Helper function to generate mock competitor data
function generateMockCompetitorData(competitor, ticker, type) {
  const ratings = ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'];
  const outlooks = ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'];
  
  // Simulate different ratings based on ticker and type
  const tickerHash = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const typeHash = type === 'monthly' ? 10 : 5;
  const competitorHash = competitor === 'wallStreetZen' ? 3 : 7;
  
  const combinedHash = (tickerHash + typeHash + competitorHash) % 5;
  
  if (competitor === 'wallStreetZen') {
    return {
      rating: ratings[combinedHash],
      confidence: 60 + (combinedHash * 5)
    };
  } else {
    return {
      outlook: outlooks[combinedHash],
      confidence: 55 + (combinedHash * 5)
    };
  }
}

module.exports = router;

