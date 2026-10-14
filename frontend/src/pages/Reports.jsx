import { useState } from "react";
import api from "../api";

const TYPES = [
  { key: "daily", label: "Daily (today)" },
  { key: "weekly", label: "Weekly (last 7 days)" },
  { key: "monthly", label: "Monthly (last 30 days)" },
  { key: "custom", label: "Custom period" },
];

function Stat({ label, value, unit = "" }) {
  return (
    <div className="week-card">
      <div className="week-title">{label}</div>
      <div className="week-value">{value === null || value === undefined ? "-" : `${value}${unit}`}</div>
    </div>
  );
}

function signed(v, unit = "") {
  if (v === null || v === undefined) return "no comparison";
  return `${v > 0 ? "+" : ""}${v}${unit}`;
}

export default function Reports() {
  const [type, setType] = useState("weekly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const params = () => {
    const p = { type };
    if (type === "custom") {
      p.from = from;
      p.to = to;
    }
    return p;
  };

  const load = async () => {
    setError("");
    if (type === "custom" && (!from || !to)) {
      setError("Choose both a start and an end date.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/reports", { params: params() });
      setReport(res.data);
    } catch (err) {
      setReport(null);
      setError(err.response?.data?.error || "Could not load the report.");
    } finally {
      setLoading(false);
    }
  };

  const download = async (path, ext) => {
    setError("");
    if (type === "custom" && (!from || !to)) {
      setError("Choose both a start and an end date.");
      return;
    }
    setBusy(ext);
    try {
      const res = await api.get(`/reports/${path}`, { params: params(), responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `life_balance_${type}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(`Could not download the ${ext.toUpperCase()} file. Check the dates and try again.`);
    } finally {
      setBusy("");
    }
  };

  const cur = report?.current;
  const cmp = report?.comparison;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Reports</h2>
        <p className="muted" style={{ textAlign: "left" }}>
          Choose a period, view the summary, or download it as a PDF or Excel file.
        </p>

        {error && <div className="alert error">{error}</div>}

        <label>Report type</label>
        <select value={type} onChange={(e) => { setType(e.target.value); setReport(null); }}>
          {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        {type === "custom" && (
          <div className="report-dates">
            <div>
              <label>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}

        <div className="sim-actions">
          <button type="button" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "View report"}
          </button>
          <button type="button" className="secondary" onClick={() => download("pdf", "pdf")} disabled={!!busy}>
            {busy === "pdf" ? "Preparing PDF..." : "Download PDF"}
          </button>
          <button type="button" className="secondary" onClick={() => download("excel", "xlsx")} disabled={!!busy}>
            {busy === "xlsx" ? "Preparing Excel..." : "Download Excel"}
          </button>
        </div>
      </div>

      {report && cur && (
        <>
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ marginTop: 0, color: "#1e6f5c" }}>
              {report.period.start} to {report.period.end}
            </h3>
            {report.message && <div className="alert info">{report.message}</div>}

            <div className="week-grid">
              <Stat label="Logged days" value={cur.days} />
              <Stat label="Average sleep" value={cur.avg_sleep} unit=" h" />
              <Stat label="Average working hours" value={cur.avg_work} unit=" h" />
              <Stat label="Average activity" value={cur.avg_activity} unit=" min" />
              <Stat label="Average balance score" value={cur.avg_wlb} unit=" / 100" />
            </div>

            <h4 className="tips-title">Stress days</h4>
            <p className="result-line">
              Low: {cur.stress_counts.Low} · Moderate: {cur.stress_counts.Moderate} · High: {cur.stress_counts.High}
            </p>

            <h4 className="tips-title">Compared with the previous period ({report.previous_period.start} to {report.previous_period.end})</h4>
            <p className="result-line">
              Sleep {signed(cmp.sleep_change, " h")} · Working hours {signed(cmp.work_change, " h")} ·
              Activity {signed(cmp.activity_change, " min")} · Balance score {signed(cmp.wlb_change, " points")} ·
              High-stress days {signed(cmp.high_days_change)}
            </p>

            {cur.best_day && (
              <p className="result-line">
                Best day: {cur.best_day.date} (score {cur.best_day.wlb_score}) · Most difficult: {cur.hardest_day.date} (score {cur.hardest_day.wlb_score})
              </p>
            )}

            {cur.top_tips.length > 0 && (
              <>
                <h4 className="tips-title">Most frequent suggestions</h4>
                <ul className="factors">
                  {cur.top_tips.map((t) => (
                    <li key={t.tip}>{t.tip} (given {t.times} times)</li>
                  ))}
                </ul>
              </>
            )}

            <p className="muted" style={{ textAlign: "left" }}>{report.disclaimer}</p>
          </div>
        </>
      )}
    </div>
  );
}