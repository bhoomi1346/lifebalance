import { useEffect, useState } from "react";
import api from "../api";

const MEALS = ["Regular", "Slightly irregular", "Irregular"];

const toLocalISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const today = () => toLocalISO(new Date());
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalISO(d);
};

const emptyForm = () => ({
  log_date: today(),
  sleep_hours: "",
  working_hours: "",
  activity_minutes: "",
  water_litres: "",
  meal_regularity: "Regular",
});

export default function DailyEntry() {
  const [form, setForm] = useState(emptyForm());
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [fromWearable, setFromWearable] = useState(false);

  const loadLogs = () =>
    api
      .get("/logs", { params: { from: daysAgo(30), to: today() } })
      .then((res) => setLogs(res.data))
      .catch(() => setError("Could not load your records."));

  useEffect(() => {
    loadLogs();
  }, []);

  const existing = logs.find((l) => l.log_date === form.log_date);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fillFromWearable = async () => {
    setError("");
    try {
      const res = await api.get("/wearable/day", { params: { date: form.log_date } });
      if (!res.data.available) {
        setError("No wearable data for this date. Open Devices, connect and sync first.");
        return;
      }
      setForm((f) => ({
        ...f,
        sleep_hours: f.sleep_hours === "" && res.data.sleep_hours != null ? String(res.data.sleep_hours) : f.sleep_hours,
        activity_minutes: f.activity_minutes === "" && res.data.active_minutes != null ? String(res.data.active_minutes) : f.activity_minutes,
      }));
      setFromWearable(true);
      setMessage("Sleep and activity filled from your wearable. Check them before saving.");
    } catch {
      setError("Could not load wearable data.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const sleep = parseFloat(form.sleep_hours);
    const work = parseFloat(form.working_hours);
    if (sleep + work > 24) {
      setError("Sleep hours plus working hours cannot be more than 24.");
      return;
    }

    const payload = {
      log_date: form.log_date,
      sleep_hours: form.sleep_hours,
      working_hours: form.working_hours,
      activity_minutes: form.activity_minutes,
      water_litres: form.water_litres,
      meal_regularity: form.meal_regularity,
      source: fromWearable ? "wearable" : "manual",
    };

    setSaving(true);
    try {
      const res = existing
        ? await api.put(`/logs/${existing.log_id}`, payload)
        : await api.post("/logs", payload);
      setMessage(existing ? "Record updated." : "Record saved.");
      setPrediction(res.data.prediction || null);
      setForm(emptyForm());
      setFromWearable(false);
      await loadLogs();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the record.");
    } finally {
      setSaving(false);
    }
  };

  const updateTipStatus = async (recId, status) => {
    try {
      await api.put(`/recommendations/${recId}/status`, { status });
      setPrediction((p) => ({
        ...p,
        recommendations: p.recommendations.map((r) => (r.rec_id === recId ? { ...r, status } : r)),
      }));
    } catch {
      setError("Could not save your feedback. Please try again.");
    }
  };

  const handleEdit = (log) => {
    setMessage("");
    setError("");
    setPrediction(null);
    setFromWearable(false);
    setForm({
      log_date: log.log_date,
      sleep_hours: String(log.sleep_hours),
      working_hours: String(log.working_hours),
      activity_minutes: String(log.activity_minutes),
      water_litres: String(log.water_litres),
      meal_regularity: log.meal_regularity,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (log) => {
    if (!window.confirm(`Delete the record for ${log.log_date}?`)) return;
    try {
      await api.delete(`/logs/${log.log_id}`);
      setMessage("Record deleted.");
      setPrediction(null);
      await loadLogs();
    } catch {
      setError("Could not delete the record.");
    }
  };

  return (
    <div className="entry-layout">
      <div className="entry-main">
        <div className="card">
          <h2>Daily entry</h2>
          {existing && (
            <div className="alert info">A record already exists for this date. Saving will update it.</div>
          )}
          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label>Date</label>
              <input type="date" name="log_date" value={form.log_date}
                min={daysAgo(30)} max={today()} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Sleep (hours)</label>
              <input type="number" name="sleep_hours" min="0" max="24" step="0.1"
                value={form.sleep_hours} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Working hours</label>
              <input type="number" name="working_hours" min="0" max="24" step="0.1"
                value={form.working_hours} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Physical activity (minutes)</label>
              <input type="number" name="activity_minutes" min="0" max="600" step="1"
                value={form.activity_minutes} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Water intake (litres)</label>
              <input type="number" name="water_litres" min="0" max="10" step="0.1"
                value={form.water_litres} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Meal regularity</label>
              <select name="meal_regularity" value={form.meal_regularity} onChange={handleChange}>
                {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={fillFromWearable}>
                Fill sleep and activity from wearable
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : existing ? "Update record" : "Save record"}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <h2>Your last 30 days</h2>
          {logs.length === 0 ? (
            <p className="muted">No records yet. Add your first one above.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Sleep</th><th>Work</th><th>Activity</th>
                    <th>Water</th><th>Meals</th><th>Source</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.log_id}>
                      <td>{l.log_date}</td>
                      <td>{l.sleep_hours} h</td>
                      <td>{l.working_hours} h</td>
                      <td>{l.activity_minutes} min</td>
                      <td>{l.water_litres} L</td>
                      <td>{l.meal_regularity}</td>
                      <td>{l.source}</td>
                      <td className="actions">
                        <button type="button" onClick={() => handleEdit(l)}>Edit</button>
                        <button type="button" className="danger" onClick={() => handleDelete(l)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <aside className="entry-side">
        {prediction ? (
          <div className="card prediction">
            <h2>Your result for the day</h2>
            <p className="result-line">
              Stress: <strong className={`stress-${prediction.stress_level.toLowerCase()}`}>
                {prediction.stress_level}
              </strong>{" "}
              ({Math.round(prediction.probabilities[prediction.stress_level] * 100)}% confidence)
            </p>
            <p className="result-line">
              Balance score: <strong>{prediction.wlb_score} / 100</strong> ({prediction.wlb_band})
            </p>

            {prediction.top_factors.length > 0 && (
              <>
                <p className="muted" style={{ textAlign: "left", marginBottom: 4 }}>What affected it most:</p>
                <ul className="factors">
                  {prediction.top_factors.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </>
            )}

            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <>
                <h3 className="tips-title">Suggestions for you</h3>
                <ul className="tips">
                  {prediction.recommendations.map((r) => {
                    const [advice, why] = r.text.split(" Why: ");
                    return (
                      <li key={r.rec_id} className={`tip tip-${r.status}`}>
                        <div className="tip-text">{advice}</div>
                        {why && <div className="tip-why">Why: {why}</div>}
                        <div className="tip-actions">
                          {r.status === "done" && <span className="tip-badge done">Done</span>}
                          {r.status === "not_relevant" && <span className="tip-badge skip">Not relevant</span>}
                          {r.status === "new" && (
                            <>
                              <button type="button" onClick={() => updateTipStatus(r.rec_id, "done")}>Done</button>
                              <button type="button" className="secondary"
                                onClick={() => updateTipStatus(r.rec_id, "not_relevant")}>
                                Not relevant
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <p className="muted" style={{ textAlign: "left" }}>{prediction.disclaimer}</p>
            <button type="button" className="secondary" onClick={() => setPrediction(null)}>Close</button>
          </div>
        ) : (
          <div className="card placeholder-card">
            <h2>Your result</h2>
            <p>After you save a day, your stress estimate, balance score and suggestions appear here and stay in view while you scroll.</p>
          </div>
        )}
      </aside>
    </div>
  );
}