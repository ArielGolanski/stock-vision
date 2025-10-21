import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react"; // npm install lucide-react

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.answer || "No answer available." },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error: Unable to reach chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all z-50"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl font-semibold">
            Stock Assistant 💬
          </div>

          <div className="flex-1 overflow-y-auto p-3 max-h-96 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-sm ${
                  m.role === "user"
                    ? "bg-blue-100 text-right"
                    : "bg-gray-100 text-left"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 text-sm italic">Bot is typing...</div>
            )}
          </div>

          <div className="flex border-t">
            <input
              type="text"
              className="flex-1 p-2 text-sm border-none outline-none rounded-bl-2xl"
              placeholder="Ask about investing..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-br-2xl text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
