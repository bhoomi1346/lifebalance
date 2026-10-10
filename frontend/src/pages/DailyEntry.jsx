import { useEffect, useState } from "react";
import api from "../api";

const MEALS = ["Regular", "Slightly irregular", "Irregular"];
const STRESS = ["Low", "Moderate", "High"];

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
  mood: "3",
  self_reported_stress: "",
});

export default function DailyEntry() {
  const [form, setForm] = useState(emptyForm());
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
      mood: form.mood,
      self_reported_stress: form.self_reported_stress,
    };

    setSaving(true);
    try {
      if (existing) {
        await api.put(`/logs/${existing.log_id}`, payload);
        setMessage("Record updated.");
      } else {
        await api.post("/logs", payload);
        setMessage("Record saved.");
      }
      setForm(emptyForm());
      await loadLogs();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save the record.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (log) => {
    setMessage("");
    setError("");
    setForm({
      log_date: log.log_date,
      sleep_hours: String(log.sleep_hours),
      working_hours: String(log.working_hours),
      activity_minutes: String(log.activity_minutes),
      water_litres: String(log.water_litres),
      meal_regularity: log.meal_regularity,
      mood: String(log.mood),
      self_reported_stress: log.self_reported_stress || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (log) => {
    if (!window.confirm(`Delete the record for ${log.log_date}?`)) return;
    try {
      await api.delete(`/logs/${log.log_id}`);
      setMessage("Record deleted.");
      await loadLogs();
    } catch {
      setError("Could not delete the record.");
    }
  };

  return (
    <div>
      <div className="card auth-card">
        <h2>Daily entry</h2>
        {existing && (
          <div className="alert info">
            A record already exists for this date. Saving will update it.
          </div>
        )}
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Date</label>
          <input
            type="date"
            name="log_date"
            value={form.log_date}
            min={daysAgo(30)}
            max={today()}
            onChange={handleChange}
            required
          />

          <label>Sleep (hours)</label>
          <input type="number" name="sleep_hours" min="0" max="24" step="0.1"
            value={form.sleep_hours} onChange={handleChange} required />

          <label>Working hours</label>
          <input type="number" name="working_hours" min="0" max="24" step="0.1"
            value={form.working_hours} onChange={handleChange} required />

          <label>Physical activity (minutes)</label>
          <input type="number" name="activity_minutes" min="0" max="600" step="1"
            value={form.activity_minutes} onChange={handleChange} required />

          <label>Water intake (litres)</label>
          <input type="number" name="water_litres" min="0" max="10" step="0.1"
            value={form.water_litres} onChange={handleChange} required />

          <label>Meal regularity</label>
          <select name="meal_regularity" value={form.meal_regularity} onChange={handleChange}>
            {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <label>Mood (1 = very low, 5 = very good)</label>
          <select name="mood" value={form.mood} onChange={handleChange}>
            <option value="">Prefer not to say</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <label>How stressed do you feel today? (optional)</label>
          <select name="self_reported_stress" value={form.self_reported_stress} onChange={handleChange}>
            <option value="">Prefer not to say</option>
            {STRESS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : existing ? "Update record" : "Save record"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Your last 30 days</h2>
        {logs.length === 0 ? (
          <p className="muted">No records yet. Add your first one above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Sleep</th><th>Work</th><th>Activity</th>
                  <th>Water</th><th>Meals</th><th>Mood</th><th>Stress</th><th></th>
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
                    <td>{l.mood}</td>
                    <td>{l.self_reported_stress || "-"}</td>
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
  );
}