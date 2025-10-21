// --- Chat Handler ---
exports.chat = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Dynamic import for ES module compatibility
    const fetch = (await import("node-fetch")).default;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an investing assistant chatbot. Explain stock investing concepts clearly but never give personalized financial advice or stock recommendations.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer.";
    res.json({ answer });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Failed to get chatbot response" });
  }
};
