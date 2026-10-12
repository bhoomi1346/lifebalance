import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const QUICK = [
  "How was my sleep this week?",
  "What was my stress level?",
  "How is my work-life balance?",
  "How active was I this week?",
  "Give me a tip for today",
  "What can you do?",
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    api
      .get("/chat/history")
      .then((res) => setMessages(res.data))
      .catch(() => setError("Could not load your chat history."));
  }, []);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setError("");
    setSending(true);
    setInput("");
    setMessages((m) => [...m, { sender: "user", message: msg }]);
    try {
      const res = await api.post("/chat", { message: msg });
      setMessages((m) => [
        ...m,
        { sender: "bot", message: res.data.text, actions: res.data.actions },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all your chat history?")) return;
    try {
      await api.delete("/chat/history");
      setMessages([]);
    } catch {
      setError("Could not clear the history.");
    }
  };

  return (
    <div className="card chat-card">
      <div className="chat-head">
        <h2 style={{ margin: 0, color: "#1e6f5c" }}>Wellness assistant</h2>
        <button type="button" className="secondary-btn" onClick={clearAll}>Clear history</button>
      </div>
      <p className="muted" style={{ textAlign: "left", marginTop: 4 }}>
        General wellness information, not medical advice or diagnosis. Answers about your data use your own records.
      </p>

      {error && <div className="alert error">{error}</div>}

      <div className="chat-log">
        {messages.length === 0 && (
          <p className="muted">Ask a question below, or tap a suggestion.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.sender === "user" ? "bubble-user" : "bubble-bot"}`}>
            <div>{m.message}</div>
            {m.actions && m.actions.length > 0 && (
              <div className="chat-actions">
                {m.actions.map((a) => (
                  <Link key={a.path} to={a.path} className="chat-link">{a.label}</Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <div className="bubble bubble-bot muted">Thinking...</div>}
        <div ref={endRef} />
      </div>

      <div className="quick-row">
        {QUICK.map((q) => (
          <button key={q} type="button" className="quick-btn" onClick={() => send(q)} disabled={sending}>
            {q}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question..."
          maxLength={500}
        />
        <button type="submit" disabled={sending || !input.trim()}>Send</button>
      </form>
    </div>
  );
}