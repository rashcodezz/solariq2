import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const SUGGESTED_QUESTIONS = [
  "Is solar worth it for my location?",
  "How does my payback period compare to average?",
  "What if I doubled my roof area?",
  "How much CO₂ will I save in 10 years?",
];

export default function SolarChat({ result, location }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `I've analyzed your solar report. Your system could generate ${result.annual_energy_kwh.toFixed(0)} kWh/year and pay itself back in ${result.payback_years?.toFixed(1) || "N/A"} years. What would you like to know?`,
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);

  const getHistory = () =>
    messages
      .filter((_, i) => i > 0)
      .reduce((acc, msg, i, arr) => {
        if (msg.role === "user" && arr[i + 1]?.role === "assistant") {
          acc.push({ question: msg.text, answer: arr[i + 1].text });
        }
        return acc;
      }, []);

  const sendMessage = async (question) => {
    if (!question.trim() || loading) return;

    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          result,
          location,
          history: getHistory(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.error || "Something went wrong." },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Could not reach the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card chat-card">
      <h2 className="card-title">Ask SolarIQ Assistant</h2>
      <p className="chart-subtitle">
        Ask anything about your solar report
      </p>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <span className="chat-role">
              {msg.role === "assistant" ? "SolarIQ" : "You"}
            </span>
            <p className="chat-text">{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant">
            <span className="chat-role">SolarIQ</span>
            <p className="chat-text chat-typing">Thinking...</p>
          </div>
        )}
      </div>

      <div className="chat-suggestions">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            className="suggestion-btn"
            onClick={() => sendMessage(q)}
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          placeholder="Ask about your solar report..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}