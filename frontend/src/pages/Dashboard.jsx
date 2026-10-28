import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BarController,
  DoughnutController,
  PieController,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../api";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  BarController, DoughnutController, PieController, Tooltip, Legend
);

const VIEWS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const SLEEP_BANDS = ["Under 6 h", "6 to 7 h", "7 to 9 h", "Over 9 h"];
const SLEEP_COLOURS = ["#e9a03a", "#8277da", "#7cc4d6", "#f08f72"];

function sleepBand(hours) {
  if (hours < 6) return 0;
  if (hours < 7) return 1;
  if (hours <= 9) return 2;
  return 3;
}

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

function WeekCard({ title, now, before, unit = "" }) {
  return (
    <div className="week-card">
      <div className="week-title">{title}</div>
      <div className="week-value">{now === null ? "-" : `${now}${unit}`}</div>
      <div className="week-compare">
        Last week: {before === null ? "-" : `${before}${unit}`} &nbsp;
        <Arrow now={now} before={before} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("daily");
  const [range, setRange] = useState(null);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load your dashboard."));
  }, []);

  useEffect(() => {
    setRange(null);
    api
      .get("/dashboard/range", { params: { range: view } })
      .then((res) => setRange(res.data))
      .catch(() => setError("Could not load the charts."));
  }, [view]);

  if (error) return <div className="card auth-card"><div className="alert error">{error}</div></div>;
  if (!data) return <p>Loading your dashboard...</p>;

  const t = data.today;
  const tw = data.this_week;
  const lw = data.last_week;
  const points = range ? range.points : [];
  const labels = points.map((p) => p.label);

  // Pie: how the sleep average of each day (or period) falls into a sleep band
  const bandCounts = [0, 0, 0, 0];
  points.forEach((p) => {
    if (p.avg_sleep !== null) bandCounts[sleepBand(p.avg_sleep)] += 1;
  });
  const sleepTotal = bandCounts.reduce((a, b) => a + b, 0);

  const pieData = {
    labels: SLEEP_BANDS,
    datasets: [
      {
        data: bandCounts,
        backgroundColor: SLEEP_COLOURS,
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const count = ctx.raw;
            const pct = sleepTotal ? Math.round((count / sleepTotal) * 100) : 0;
            return `${ctx.label}: ${count} (${pct}%)`;
          },
        },
      },
    },
  };

  const barData = {
    labels,
    datasets: [
      {
        label: "Average activity (min)",
        data: points.map((p) => p.avg_activity),
        backgroundColor: "#a196e6",
        borderRadius: 6,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    scales: { y: { beginAtZero: true, title: { display: true, text: "Minutes" } } },
  };

  const totals = range ? range.stress_totals : { Low: 0, Moderate: 0, High: 0 };
  const totalDays = totals.Low + totals.Moderate + totals.High;
  const doughnutData = {
    labels: ["Low", "Moderate", "High"],
    datasets: [
      {
        data: [totals.Low, totals.Moderate, totals.High],
                backgroundColor: ["#3aa597", "#e9a03a", "#e4666b"],
      },
    ],
  };
  const doughnutOptions = { responsive: true, plugins: { legend: { position: "bottom" } } };

  return (
    <div>
      {data.warning && (
        <div
          className={`alert ${data.warning.type === "persistent_high" ? "error" : "info"}`}
          style={{ marginBottom: 16 }}
        >
          <strong>{data.warning.title}.</strong> {data.warning.message}
        </div>
      )}

      <div className="card hero">
        <h2 style={{ marginTop: 0 }}>Today</h2>
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
        <div className="view-toggle">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              className={view === v.key ? "active" : ""}
              onClick={() => setView(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {!range ? (
          <p className="muted">Loading charts...</p>
        ) : points.length === 0 ? (
          <p className="muted">No records in this period yet. Add daily entries to see your charts.</p>
        ) : (
          <>
            <h3 className="chart-title">Sleep bands ({sleepTotal} periods with sleep data)</h3>
            <div style={{ maxWidth: 320, margin: "0 auto" }}>
              <Pie data={pieData} options={pieOptions} />
            </div>

            <h3 className="chart-title">Physical activity</h3>
            <Bar data={barData} options={barOptions} />

            <h3 className="chart-title">Stress level split ({totalDays} scored days)</h3>
            {totalDays === 0 ? (
              <p className="muted">No stress results in this period yet.</p>
            ) : (
              <div style={{ maxWidth: 300, margin: "0 auto" }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            )}
          </>
        )}
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