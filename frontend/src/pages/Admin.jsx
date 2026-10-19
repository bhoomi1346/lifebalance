import { useEffect, useState } from "react";
import api from "../api";

const RULE_FIELDS = [
  { key: "sleep_min", label: "Sleep: lower end of the healthy range (hours)", step: 0.5 },
  { key: "sleep_max", label: "Sleep: upper end of the healthy range (hours)", step: 0.5 },
  { key: "work_limit", label: "Working hours before a work tip appears", step: 0.5 },
  { key: "activity_target", label: "Activity target (minutes per day)", step: 5 },
  { key: "water_target", label: "Water target (litres per day)", step: 0.1 },
];

export default function Admin() {
  const [info, setInfo] = useState(null);
  const [rules, setRules] = useState(null);
  const [limits, setLimits] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api.get("/admin/model"), api.get("/admin/rules")])
      .then(([m, r]) => {
        setInfo(m.data);
        setRules(r.data.rules);
        setLimits(r.data.limits);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load the admin panel."));

  useEffect(() => {
    load();
  }, []);

  const retrain = async () => {
    if (!window.confirm("Retrain the stress model now? This can take about 30 seconds.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post("/admin/retrain");
      setMessage(res.data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Retraining failed. Check the backend window.");
    } finally {
      setBusy(false);
    }
  };

  const saveRules = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await api.put("/admin/rules", rules);
      setMessage(res.data.message);
      setRules(res.data.rules);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the rules.");
    } finally {
      setBusy(false);
    }
  };

  if (error && !info) return <div className="card auth-card"><div className="alert error">{error}</div></div>;
  if (!info || !rules) return <p>Loading the admin panel...</p>;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Admin: model</h2>
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <p className="result-line">
          Active model: <strong>{info.active.version}</strong> ({info.active.algorithm})
        </p>
        <div className="week-grid">
          <div className="week-card">
            <div className="week-title">Accuracy (hold-out)</div>
            <div className="week-value">{info.active.accuracy}</div>
          </div>
          <div className="week-card">
            <div className="week-title">Macro F1 (hold-out)</div>
            <div className="week-value">{info.active.macro_f1}</div>
          </div>
          <div className="week-card">
            <div className="week-title">Predictions made</div>
            <div className="week-value">{info.total_predictions}</div>
          </div>
        </div>

        <h3 className="tips-title">Model versions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Version</th><th>Algorithm</th><th>Accuracy</th><th>Macro F1</th><th>Rows</th><th>Status</th></tr>
            </thead>
            <tbody>
              {info.versions.map((v) => (
                <tr key={v.version}>
                  <td>{v.version}</td>
                  <td>{v.algorithm}</td>
                  <td>{v.accuracy}</td>
                  <td>{v.macro_f1}</td>
                  <td>{v.trained_on_rows}</td>
                  <td>{v.is_active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sim-actions">
          <button type="button" onClick={retrain} disabled={busy}>
            {busy ? "Working..." : "Retrain model"}
          </button>
        </div>
        <p className="muted" style={{ textAlign: "left" }}>
          A retrained model is activated only if its macro F1 is not lower than the active one.
        </p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Admin: recommendation rules</h2>
        <p className="muted" style={{ textAlign: "left" }}>
          These thresholds decide when a tip appears. They can only be changed within the safe limits shown.
          New daily records use the new values. Existing records keep their saved tips.
        </p>

        {RULE_FIELDS.map((f) => (
          <div key={f.key}>
            <label>{f.label}</label>
            <input
              type="number"
              step={f.step}
              min={limits[f.key][0]}
              max={limits[f.key][1]}
              value={rules[f.key]}
              onChange={(e) => setRules({ ...rules, [f.key]: e.target.value })}
            />
            <div className="muted" style={{ textAlign: "left", fontSize: "0.85rem" }}>
              Allowed: {limits[f.key][0]} to {limits[f.key][1]}
            </div>
          </div>
        ))}

        <div className="sim-actions">
          <button type="button" onClick={saveRules} disabled={busy}>Save rules</button>
        </div>
      </div>
    </div>
  );
}