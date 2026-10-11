import { useEffect, useState } from "react";
import api from "../api";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const toMonthKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;

function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d.getFullYear(), d.getMonth() + 1);
}

function cellLabel(day) {
  if (!day.entry) return { text: "No entry", cls: "cal-none" };
  if (!day.stress_level) return { text: "Not scored", cls: "cal-unscored" };
  return { text: day.stress_level, cls: `cal-${day.stress_level.toLowerCase()}` };
}

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(toMonthKey(now.getFullYear(), now.getMonth() + 1));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api
      .get("/calendar", { params: { month } })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load the calendar."));
  }, [month]);

  const [year, mon] = month.split("-").map(Number);
  // Monday-first offset: Monday = 0, Sunday = 6
  const firstWeekday = (new Date(year, mon - 1, 1).getDay() + 6) % 7;

  return (
    <div>
      <div className="card">
        <div className="cal-header">
          <button type="button" onClick={() => setMonth(shiftMonth(month, -1))}>‹ Previous</button>
          <h2 style={{ margin: 0, color: "#1e6f5c" }}>{MONTHS[mon - 1]} {year}</h2>
          <button type="button" onClick={() => setMonth(shiftMonth(month, 1))}>Next ›</button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {!data && !error && <p className="muted">Loading the calendar...</p>}

        {data && (
          <>
            <p className="muted" style={{ textAlign: "left" }}>
              Logged days: {data.summary.logged_days} · High days: {data.summary.high_days}
              {data.summary.avg_wlb !== null && <> · Average balance score: {data.summary.avg_wlb}</>}
            </p>

            <div className="cal-grid">
              {WEEKDAYS.map((w) => (
                <div key={w} className="cal-weekday">{w}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`blank-${i}`} className="cal-blank" />
              ))}
              {data.days.map((day) => {
                const label = cellLabel(day);
                const dayNumber = Number(day.date.slice(8, 10));
                return (
                  <div key={day.date} className={`cal-cell ${label.cls}`}>
                    <div className="cal-date">{dayNumber}</div>
                    <div className="cal-label">{label.text}</div>
                    {day.wlb_score !== null && (
                      <div className="cal-score">{day.wlb_score} / 100</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cal-legend">
              <span><span className="swatch cal-low" /> Low</span>
              <span><span className="swatch cal-moderate" /> Moderate</span>
              <span><span className="swatch cal-high" /> High</span>
              <span><span className="swatch cal-unscored" /> Not scored</span>
              <span><span className="swatch cal-none" /> No entry</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}