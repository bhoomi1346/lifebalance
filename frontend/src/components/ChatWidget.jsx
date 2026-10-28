import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import BotText from "./BotText";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api
      .get("/chat/history")
      .then((res) => setMessages(res.data))
      .catch(() => setError("Could not load chat history."));
  }, [open]);

  useEffect(() => {
    if (open && endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (e) => {
    if (e) e.preventDefault();
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setError("");
    setSending(true);
    setMessages((m) => [...m, { sender: "user", message: msg }]);
    try {
      const res = await api.post("/chat", { message: msg });
      setMessages((m) => [...m, { sender: "bot", message: res.data.text, actions: res.data.actions }]);
    } catch (err) {
      setError(err.response?.data?.error || "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close assistant" : "Open wellness assistant"}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5A8.5 8.5 0 1 1 21 12z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel-head">
            <strong>Wellness assistant</strong>
            <Link to="/chat" onClick={() => setOpen(false)}>Full view</Link>
          </div>

          {error && <div className="alert error" style={{ marginTop: 10 }}>{error}</div>}

          <div className="chat-log chat-log-mini">
            {messages.length === 0 && (
              <p className="muted">Hi! Ask me about your sleep, stress, activity or water.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.sender === "user" ? "bubble-user" : "bubble-bot"}`}>
                {m.sender === "bot" ? <BotText text={m.message} /> : <div>{m.message}</div>}
                {m.actions && m.actions.length > 0 && (
                  <div className="chat-actions">
                    {m.actions.map((a) => (
                      <Link key={a.path} to={a.path} className="chat-link" onClick={() => setOpen(false)}>
                        {a.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && <div className="bubble bubble-bot muted">Thinking...</div>}
            <div ref={endRef} />
          </div>

          <form className="chat-form" onSubmit={send}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
            />
            <button type="submit" disabled={sending || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}