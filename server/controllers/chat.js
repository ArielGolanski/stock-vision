const axios = require('axios');

// Supported stock tickers
const SUPPORTED_TICKERS = {
  'aapl': 'AAPL',
  'apple': 'AAPL',
  'msft': 'MSFT',
  'microsoft': 'MSFT',
  'ibm': 'IBM',
  't': 'T',
  'at&t': 'T',
  'att': 'T'
};

// Extract ticker from message
const extractTicker = (message) => {
  const lowerMessage = message.toLowerCase();
  for (const [key, ticker] of Object.entries(SUPPORTED_TICKERS)) {
    if (lowerMessage.includes(key)) {
      return ticker;
    }
  }
  return null;
};

// Get ML service URL
const ML_BASE_URL = process.env.ML_SERVICE_URL || (process.env.NODE_ENV === 'production' ? 'http://ml:8000' : 'http://localhost:8000');

// --- Chat Handler ---
exports.chat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const lowerMessage = message.toLowerCase();
    
    // Check if it's a stock prediction question
    const ticker = extractTicker(lowerMessage);
    const isPredictionQuestion = lowerMessage.includes('predict') || 
                                 lowerMessage.includes('forecast') || 
                                 lowerMessage.includes('prediction') ||
                                 lowerMessage.includes('what will') ||
                                 lowerMessage.includes('future price') ||
                                 lowerMessage.includes('price prediction');
    
    const isPriceQuestion = lowerMessage.includes('price') || 
                           lowerMessage.includes('current price') ||
                           lowerMessage.includes('trading at');
    
    const isDailyQuestion = lowerMessage.includes('daily') || 
                           lowerMessage.includes('tomorrow') ||
                           lowerMessage.includes('next day');
    
    const isMonthlyQuestion = lowerMessage.includes('monthly') || 
                             lowerMessage.includes('next month') ||
                             lowerMessage.includes('month ahead');

    // If it's a stock prediction question with a valid ticker, use ML model
    if (ticker && (isPredictionQuestion || isPriceQuestion)) {
      try {
        // Determine prediction type
        const target = isMonthlyQuestion ? "Monthly Change %" : "Daily Change %";
        const days = isMonthlyQuestion ? 21 : 5; // 21 business days ≈ 1 month
        
        // Fetch prediction from ML service
        const mlResponse = await axios.get(`${ML_BASE_URL}/predict/${ticker}`, {
          params: { 
            target: target, 
            days: days 
          },
          timeout: 10000
        });

        const { future_changes, future_prices } = mlResponse.data;
        
        if (future_prices && future_prices.length > 0) {
          const currentPrice = future_prices[0] / (1 + future_changes[0] / 100);
          const nextPrice = future_prices[0];
          const changePercent = future_changes[0];
          const avgChange = (future_changes.reduce((a, b) => a + b, 0) / future_changes.length).toFixed(2);
          
          let answer = `Based on our LSTM machine learning model, here's the prediction for ${ticker}:\n\n`;
          answer += `📊 Current estimated price: $${currentPrice.toFixed(2)}\n`;
          answer += `🔮 Next ${isMonthlyQuestion ? 'month' : 'day'} predicted price: $${nextPrice.toFixed(2)}\n`;
          answer += `📈 Predicted ${isMonthlyQuestion ? 'monthly' : 'daily'} change: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%\n\n`;
          
          if (future_prices.length > 1) {
            answer += `📅 ${isMonthlyQuestion ? 'Monthly' : 'Daily'} forecast (next ${future_prices.length} ${isMonthlyQuestion ? 'months' : 'days'}):\n`;
            future_prices.slice(0, Math.min(5, future_prices.length)).forEach((price, idx) => {
              const change = future_changes[idx];
              answer += `  • Day ${idx + 1}: $${price.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)\n`;
            });
            answer += `\nAverage predicted change: ${avgChange > 0 ? '+' : ''}${avgChange}%`;
          }
          
          answer += `\n\n⚠️ Note: These are AI-generated predictions based on historical data. Always do your own research and consult with a financial advisor before making investment decisions.`;
          
          return res.json({ answer });
        }
      } catch (mlError) {
        console.error("ML service error:", mlError.message);
        // Fall through to default response if ML service fails
      }
    }

    // General stock information questions
    if (ticker && (lowerMessage.includes('info') || lowerMessage.includes('about') || lowerMessage.includes('tell me'))) {
      try {
        const stockResponse = await axios.get(`${ML_BASE_URL}/api/stock-history`, {
          params: { 
            ticker: ticker,
            range: '1mo'
          },
          timeout: 10000
        });

        const { stock_info, technical_info } = stockResponse.data;
        if (stock_info && technical_info) {
          let answer = `Here's information about ${stock_info.name} (${ticker}):\n\n`;
          answer += `💰 Current Price: $${technical_info.last_close.toFixed(2)}\n`;
          answer += `📊 Market Cap: ${stock_info.stats['Market Cap']}\n`;
          answer += `📈 P/E Ratio: ${stock_info.stats['P/E Ratio']}\n`;
          answer += `💵 Dividend Yield: ${stock_info.stats['Dividend Yield']}\n`;
          answer += `📉 52W Range: ${stock_info.stats['52W Range']}\n\n`;
          
          if (stock_info.description) {
            answer += `📝 About: ${stock_info.description.substring(0, 200)}...`;
          }
          
          return res.json({ answer });
        }
      } catch (stockError) {
        console.error("Stock info error:", stockError.message);
      }
    }

    // Default responses for common questions
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return res.json({ 
        answer: "I can help you with:\n\n" +
                "• Stock price predictions using our ML models\n" +
                "• Current stock information\n" +
                "• Daily and monthly forecasts\n" +
                "• Stock analysis for AAPL, MSFT, IBM, and T\n\n" +
                "Try asking: 'What's the prediction for AAPL?' or 'Show me MSFT price forecast'"
      });
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return res.json({ 
        answer: "Hello! I'm your Stock Prediction Assistant. I use machine learning models to provide stock predictions. " +
                "You can ask me about price predictions for AAPL, MSFT, IBM, or T. What would you like to know?"
      });
    }

    if (lowerMessage.includes('accuracy') || lowerMessage.includes('reliable')) {
      return res.json({ 
        answer: "Our LSTM (Long Short-Term Memory) neural network models are trained on historical stock data. " +
                "The models use advanced features including technical indicators to make predictions. " +
                "You can view detailed accuracy metrics on the Accuracy page in the dashboard."
      });
    }

    // Default response
    return res.json({ 
      answer: "I can help you with stock predictions using our machine learning models. " +
              "Try asking about predictions for supported stocks like:\n" +
              "• 'What's the prediction for AAPL?'\n" +
              "• 'Show me MSFT daily forecast'\n" +
              "• 'Predict IBM monthly price'\n" +
              "• 'What's the current price of T?'\n\n" +
              "Or ask 'help' to see what I can do."
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Failed to get chatbot response" });
  }
};
