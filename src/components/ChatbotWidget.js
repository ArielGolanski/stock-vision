import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";

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

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Reset messages when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hello! I'm your Stock Prediction Assistant. Click on any question below to get started!",
        timestamp: new Date()
      }]);
    }
  }, [open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle clicking on a question balloon
  const handleQuestionClick = async (questionText) => {
    // Add user's question as a message
    const userMessage = {
      role: "user",
      content: questionText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: questionText }),
      });
      const data = await res.json();

      const botMessage = {
        role: "assistant",
        content: data.answer || "No answer available.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Error: Unable to reach chatbot.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Show question balloons when chat is open and not loading
  // They will reappear after each answer so user can ask more questions
  const showQuestionBalloons = open && !loading;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) {
            // Reset messages when opening
            setMessages([]);
          }
        }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all z-50"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50" style={{ height: '500px' }}>
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl font-semibold flex items-center justify-between">
            <span>Stock Assistant 💬</span>
            <button
              onClick={() => {
                setOpen(false);
                setMessages([]);
              }}
              className="text-white hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Chat Messages */}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm max-w-[85%] whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-blue-500 text-white ml-auto text-right"
                    : "bg-gray-100 text-gray-800 text-left"
                }`}
                style={{
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px"
                }}
              >
                {m.content}
              </div>
            ))}

            {/* Question Balloons - Shown as clickable chat bubbles */}
            {showQuestionBalloons && (
              <div className="space-y-2 mt-2">
                {preparedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left p-3 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    style={{
                      borderRadius: "18px 18px 18px 4px"
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="text-gray-400 text-sm italic flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2">Bot is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
