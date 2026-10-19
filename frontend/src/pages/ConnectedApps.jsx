import { useEffect, useState } from "react";
import api from "../api";

export default function ConnectedApps() {
  const [status, setStatus] = useState(null);
  const [imported, setImported] = useState([]);
  const [consent, setConsent] = useState(false);
  const [provider, setProvider] = useState("mock");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api.get("/wearable/status"), api.get("/wearable/data")])
      .then(([s, d]) => {
        setStatus(s.data);
        setImported(d.data);
        if (s.data.available_providers.length) setProvider(s.data.available_providers[0]);
      })
      .catch(() => setError("Could not load your connected apps."));

  useEffect(() => {
    load();
  }, []);

  const run = async (fn, okText) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fn();
      setMessage(okText || res.data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const connect = () => run(() => api.post("/wearable/connect", { provider, consent: true }));
  const sync = () => run(() => api.post("/wearable/sync"));

  const disconnect = () => {
    if (!window.confirm("Disconnect the wearable?")) return;
    const keep = window.confirm(
      "Keep the data already imported?\n\nOK = keep it.\nCancel = delete it."
    );
    run(() => api.delete("/wearable/disconnect", { params: { keep: keep ? "true" : "false" } }),
        keep ? "Disconnected. Imported data was kept." : "Disconnected. Imported data was deleted.");
  };

  if (error && !status) return <div className="card auth-card"><div className="alert error">{error}</div></div>;
  if (!status) return <p>Loading...</p>;

  const conn = status.connection;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Connected apps</h2>
        <p className="muted" style={{ textAlign: "left" }}>
          You never connect your watch directly. A watch syncs to its own app, and this app can read
          that app's data with your permission.
        </p>

        <div className="alert info">
          This project uses a <strong>simulated provider</strong> for demonstration. Real Fitbit access is
          not set up, so the values are sample data.
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {!conn.connected ? (
          <>
            <p className="result-line">Status: <strong>Not connected</strong></p>
            <p className="muted" style={{ textAlign: "left" }}>{status.consent_text}</p>
            <label className="checkbox">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to share these values with this app, and I understand I can disconnect at any time.</span>
            </label>
            <div className="sim-actions">
              <button type="button" onClick={connect} disabled={!consent || busy}>
                {busy ? "Connecting..." : "Connect simulated wearable"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="result-line">
              Status: <strong className="trend-good">Connected</strong> ({conn.provider})
            </p>
            <p className="muted" style={{ textAlign: "left" }}>
              Last sync: {conn.last_sync_at ? new Date(conn.last_sync_at).toLocaleString() : "never"}
            </p>
            <div className="sim-actions">
              <button type="button" onClick={sync} disabled={busy}>
                {busy ? "Syncing..." : "Sync now"}
              </button>
              <button type="button" className="secondary" onClick={disconnect} disabled={busy}>
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>

      {imported.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0, color: "#1e6f5c" }}>Imported data</h3>
          <p className="muted" style={{ textAlign: "left" }}>
            Use these values in your Daily Entry with the "Fill sleep and activity from wearable" button.
            Your own entries are never overwritten automatically.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Sleep</th><th>Active</th><th>Steps</th><th>Resting HR</th></tr>
              </thead>
              <tbody>
                {imported.map((r) => (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td>{r.sleep_hours} h</td>
                    <td>{r.active_minutes} min</td>
                    <td>{r.steps}</td>
                    <td>{r.resting_hr} bpm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}