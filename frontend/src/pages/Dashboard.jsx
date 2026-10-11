import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Arrow({ now, before, higherIsBetter = true }) {
  if (now === null || before === null) return <span className="muted-inline">no data</span>;
  if (now === before) return <span className="muted-inline">no change</span>;
  const up = now > before;
  const good = higherIsBetter ? up : !up;
  return (
    <span className={good ? "trend-good" : "trend-bad"}>
      {up ? "▲" : "▼"} {Math.abs(Math.round((now - before) * 10) / 10)}
    </span>
  );
}

function WeekCard({ title, now, before, unit = "", higherIsBetter = true }) {
  return (
    <div className="week-card">
      <div className="week-title">{title}</div>
      <div className="week-value">
        {now === null ? "-" : `${now}${unit}`}
      </div>
      <div className="week-compare">
        Last week: {before === null ? "-" : `${before}${unit}`} &nbsp;
        <Arrow now={now} before={before} higherIsBetter={higherIsBetter} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load your dashboard."));
  }, []);

  if (error) return <div className="card auth-card"><div className="alert error">{error}</div></div>;
  if (!data) return <p>Loading your dashboard...</p>;

  const t = data.today;
  const tw = data.this_week;
  const lw = data.last_week;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>Today</h2>
        {t && t.stress_level ? (
          <>
            <p className="result-line">
              Stress: <strong className={`stress-${t.stress_level.toLowerCase()}`}>{t.stress_level}</strong>
              {"   "}Balance score: <strong>{t.wlb_score} / 100</strong> ({t.wlb_band})
            </p>
            {t.top_tip && <p className="result-line"><strong>Top suggestion:</strong> {t.top_tip}</p>}
          </>
        ) : (
          <p className="muted" style={{ textAlign: "left" }}>
            No entry for today yet. <Link to="/daily">Add today's record</Link> to see your result.
          </p>
        )}
      </div>

      <div className="week-grid">
        <WeekCard title="Average sleep (this week)" now={tw.avg_sleep} before={lw.avg_sleep} unit=" h" />
        <WeekCard title="Average activity (this week)" now={tw.avg_activity} before={lw.avg_activity} unit=" min" />
        <WeekCard title="Average balance score (this week)" now={tw.avg_wlb} before={lw.avg_wlb} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <p className="muted" style={{ textAlign: "left" }}>
          Days logged: {tw.days} this week, {lw.days} last week.
        </p>
        <p className="muted" style={{ textAlign: "left" }}>{data.disclaimer}</p>
      </div>
    </div>
  );
}