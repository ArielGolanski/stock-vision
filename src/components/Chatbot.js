import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';
import { API_URL } from '../config';

// Prepared questions for the demo chatbot
const preparedQuestions = [
  "What's the prediction for AAPL?",
  "Show me MSFT daily forecast",
  "Predict IBM monthly price",
  "What's the current price of T?",
  "Tell me about AAPL",
  "How accurate are your predictions?",
  "What can you do?"
];

// Fetch response from backend API
const getAIResponse = async (message) => {
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();
    return data.answer || "Sorry, I couldn't process that request. Please try again.";
  } catch (error) {
    console.error('Chat API error:', error);
    return "I'm having trouble connecting to the prediction service. Please try again later.";
  }
};

const Chatbot = () => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize with welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Hello! I'm your Stock Prediction Assistant. Click on any question below to get started!",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle clicking on a question balloon
  const handleQuestionClick = async (questionText) => {
    // Add user's question as a message
    const userMessage = {
      id: Date.now(),
      text: questionText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Get answer from backend
      const botResponse = await getAIResponse(questionText);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if we should show question balloons (show them if no user messages yet)
  const showQuestionBalloons = messages.filter(m => !m.isBot).length === 0;

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
        <div className={`fixed bottom-24 right-6 w-96 h-[600px] rounded-lg shadow-xl border z-40 flex flex-col ${
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
              <div className="flex flex-col">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Stock Prediction Assistant
                </h3>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Powered by ML
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                // Reset messages when closing
                setMessages([]);
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Chat Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.isBot
                      ? darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
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

            {/* Question Balloons - Shown as clickable chat bubbles */}
            {showQuestionBalloons && (
              <div className="space-y-2">
                {preparedQuestions.map((question, index) => (
                  <div key={index} className="flex justify-start">
                    <button
                      onClick={() => handleQuestionClick(question)}
                      className={`max-w-xs px-4 py-3 rounded-2xl text-left transition-all transform hover:scale-105 active:scale-95 ${
                        darkMode
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                          : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md'
                      }`}
                    >
                      <p className="text-sm font-medium">{question}</p>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`max-w-xs px-4 py-2 rounded-2xl ${
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
        </div>
      )}
    </>
  );
};

export default Chatbot;
