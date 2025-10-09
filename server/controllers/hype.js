const { getStockMentions, getHypeLevel } = require('../services/redditService');

exports.getHypeMeter = async (req, res) => {
  try {
    const { ticker, timeframe = 'day' } = req.query;

    if (!ticker) {
      return res.status(400).json({ message: 'Ticker is required' });
    }

    // Get Reddit mentions
    const data = await getStockMentions(ticker.toUpperCase(), timeframe);
    const hypeLevel = getHypeLevel(data.hypeScore);

    res.json({
      ...data,
      hypeLevel
    });
  } catch (error) {
    console.error('HypeMeter error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch hype data',
      error: error.message 
    });
  }
};