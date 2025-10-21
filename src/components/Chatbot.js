import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

// Mock AI responses for stock-related queries
const getAIResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Stock price questions
  if (lowerMessage.includes('price') && (lowerMessage.includes('aapl') || lowerMessage.includes('apple'))) {
    return "Apple (AAPL) is currently trading around $175.50. Our AI model predicts a 2.3% increase for the next trading day. You can view detailed predictions on the Dashboard.";
  }
  
  if (lowerMessage.includes('price') && (lowerMessage.includes('msft') || lowerMessage.includes('microsoft'))) {
    return "Microsoft (MSFT) is currently around $345.20. Our model shows a slight decline of 0.8% for daily predictions, but a positive 2.1% trend for monthly outlook.";
  }
  
  if (lowerMessage.includes('price') && (lowerMessage.includes('ibm'))) {
    return "IBM is trading at approximately $142.80. Our AI model indicates a positive trend with 0.9% daily and 3.2% monthly growth predictions.";
  }
  
  if (lowerMessage.includes('price') && (lowerMessage.includes('t') || lowerMessage.includes('at&t'))) {
    return "AT&T (T) is currently around $18.45. Our model shows mixed signals with a slight daily decline but positive monthly outlook of 1.8%.";
  }
  
  // Prediction questions
  if (lowerMessage.includes('predict') || lowerMessage.includes('forecast')) {
    return "Our AI model uses LSTM neural networks trained on historical data to make predictions. You can view detailed accuracy metrics on the Accuracy page and compare with competitors on the Competitor Predictions page.";
  }
  
  if (lowerMessage.includes('accuracy') || lowerMessage.includes('reliable')) {
    return "Our model achieves high accuracy with MAE (Mean Absolute Error) typically under 2.5 for most stocks. Check the Accuracy page for detailed performance metrics and grades.";
  }
  
  // Market questions
  if (lowerMessage.includes('market') || lowerMessage.includes('trend')) {
    return "Current market trends show mixed signals across sectors. Technology stocks like AAPL and MSFT are showing resilience, while telecom stocks like T are experiencing volatility. Use our HypeMeter feature to see social sentiment.";
  }
  
  if (lowerMessage.includes('buy') || lowerMessage.includes('sell') || lowerMessage.includes('invest')) {
    return "I can't provide specific investment advice, but I can help you understand our predictions and market data. Always do your own research and consider consulting with a financial advisor.";
  }
  
  // Navigation help
  if (lowerMessage.includes('navigate') || lowerMessage.includes('page') || lowerMessage.includes('where')) {
    return "Here's what you can explore: Dashboard - Main stock charts and predictions, Accuracy - Model performance metrics, Competitor Predictions - Compare with WallStreetZen and Yahoo Finance, Settings - Account preferences.";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I can help you with: Stock price information, Prediction explanations, Market trends, Navigation guidance, and general questions about our AI models. What would you like to know?";
  }
  
  // General responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your Stock Assistant. I can help you understand stock predictions, market trends, and navigate the platform. What would you like to know?";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Feel free to ask me anything else about stocks or our platform.";
  }
  
  // Default response
  return "I understand you're asking about stocks and predictions. Could you be more specific? I can help with stock prices, predictions, market trends, or navigation. Try asking about AAPL, MSFT, IBM, or T stock prices, or ask about our AI model's accuracy.";
};

// Sample prompts for first-time users
const samplePrompts = [
  "What's the current price of AAPL?",
  "How accurate are your predictions?",
  "Show me market trends",
  "How do I navigate the platform?"
];

const Chatbot = () => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatbot-messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Add welcome message for first-time users
      setMessages([{
        id: Date.now(),
        text: "Hello! I'm your Stock Assistant. I can help you with stock information, predictions, and navigation. What would you like to know?",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('chatbot-messages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const botResponse = getAIResponse(messageText);
    const botMessage = {
      id: Date.now() + 1,
      text: botResponse,
      isBot: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        style={{ transform: isOpen ? 'scale(0.9)' : 'scale(1)' }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 w-80 h-96 rounded-lg shadow-xl border z-40 flex flex-col ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Stock Assistant
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isBot
                      ? darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.isBot 
                      ? darkMode ? 'text-gray-400' : 'text-gray-500'
                      : 'text-indigo-200'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className={`max-w-xs px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Sample Prompts (only show for first-time users) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Try asking:
              </p>
              <div className="flex flex-wrap gap-1">
                {samplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(prompt)}
                    className={`text-xs px-2 py-1 rounded-full border ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about stocks, predictions..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode
                    ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
                    : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                }`}
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  !inputMessage.trim() || isTyping
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
