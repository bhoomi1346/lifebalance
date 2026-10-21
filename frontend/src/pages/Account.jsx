import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Account() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await api.get("/account/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "life_balance_my_data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Your data was downloaded as a JSON file.");
    } catch {
      setError("Could not export your data. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setError("");
    setMessage("");
    if (confirmText !== "DELETE") {
      setError("Type DELETE in capital letters to confirm.");
      return;
    }
    if (!window.confirm("This permanently deletes your account and all your data. Continue?")) return;
    setBusy(true);
    try {
      await api.delete("/account", { data: { password } });
      logout();
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card auth-card">
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Your data</h2>
        <p className="muted" style={{ textAlign: "left" }}>
          Download a copy of everything this app holds about you, as a JSON file.
        </p>
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}
        <div className="sim-actions">
          <button type="button" onClick={exportData} disabled={busy}>Download my data</button>
        </div>
      </div>

      <div className="card auth-card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#a12622" }}>Delete my account</h2>
        <p className="muted" style={{ textAlign: "left" }}>
          This permanently deletes your profile, daily records, predictions, suggestions, chat history
          and wearable connection. It cannot be undone.
        </p>
        <label>Your password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label>Type DELETE to confirm</label>
        <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        <div className="sim-actions">
          <button type="button" className="danger-btn" onClick={deleteAccount}
            disabled={busy || !password || !confirmText}>
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}