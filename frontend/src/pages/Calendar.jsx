import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function DayPanel({ date, onClose }) {
  const [log, setLog] = useState(undefined);   // undefined = loading, null = no entry
  const [recs, setRecs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setLog(undefined);
    setRecs([]);
    setError("");
    api
      .get("/logs", { params: { from: date, to: date } })
      .then((res) => {
        const found = res.data.find((l) => l.log_date === date) || null;
        setLog(found);
        if (found) {
          return api
            .get("/recommendations", { params: { date } })
            .then((r) => setRecs(r.data));
        }
      })
      .catch(() => setError("Could not load this day."));
  }, [date]);

  const dayName = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="card day-panel">
      <div className="day-panel-head">
        <h3 style={{ margin: 0, color: "#1e6f5c" }}>{dayName}</h3>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {log === undefined && !error && <p className="muted">Loading...</p>}

      {log === null && (
        <>
          <p className="muted" style={{ textAlign: "left" }}>No entry for this day.</p>
          <Link to={`/daily?date=${date}`}>Add an entry for this day</Link>
        </>
      )}

      {log && (
        <>
          <p className="result-line">
            Sleep {log.sleep_hours} h · Work {log.working_hours} h · Activity {log.activity_minutes} min ·
            Water {log.water_litres} L · Meals {log.meal_regularity}
            {log.mood !== null && <> · Mood {log.mood}</>}
          </p>
          <p className="muted" style={{ textAlign: "left" }}>
            Stress and score are shown on the calendar grid. Recalculated results are shown when you save the record.
          </p>

          {recs.length > 0 && (
            <>
              <h4 className="tips-title">Suggestions for this day</h4>
              <ul className="tips">
                {recs.map((r) => {
                  const [advice, why] = r.text.split(" Why: ");
                  return (
                    <li key={r.rec_id} className={`tip tip-${r.status}`}>
                      <div className="tip-text">{advice}</div>
                      {why && <div className="tip-why">Why: {why}</div>}
                      <div className="tip-actions">
                        {r.status === "done" && <span className="tip-badge done">Done</span>}
                        {r.status === "not_relevant" && <span className="tip-badge skip">Not relevant</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <Link to={`/daily?date=${date}`}>Edit this day</Link>
        </>
      )}
    </div>
  );
}

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(toMonthKey(now.getFullYear(), now.getMonth() + 1));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setData(null);
    setError("");
    setSelected(null);
    api
      .get("/calendar", { params: { month } })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load the calendar."));
  }, [month]);

  const [year, mon] = month.split("-").map(Number);
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
                const isSelected = selected === day.date;
                return (
                  <button
                    type="button"
                    key={day.date}
                    onClick={() => setSelected(isSelected ? null : day.date)}
                    className={`cal-cell ${label.cls} ${isSelected ? "cal-selected" : ""}`}
                  >
                    <div className="cal-date">{dayNumber}</div>
                    <div className="cal-label">{label.text}</div>
                    {day.wlb_score !== null && (
                      <div className="cal-score">{day.wlb_score} / 100</div>
                    )}
                  </button>
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

      {selected && <DayPanel date={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}