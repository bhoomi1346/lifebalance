export default function BotText({ text }) {
  const parts = (text || "")
    .split(/\s*•\s*|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) return <p className="bot-line">{text}</p>;

  return (
    <ul className="bot-list">
      {parts.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  );
}