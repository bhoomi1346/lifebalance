import { useEffect, useState } from "react";
import api from "../api";

const MEALS = ["Regular", "Slightly irregular", "Irregular"];

function Slider({ label, name, value, min, max, step, unit, onChange }) {
  return (
    <div className="slider-row">
      <label>
        {label}: <strong>{value} {unit}</strong>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(name, Number(e.target.value))}
      />
    </div>
  );
}

function ResultCard({ title, result }) {
  return (
    <div className="week-card">
      <div className="week-title">{title}</div>
      <div className="week-value">{result.wlb_score} / 100</div>
      <div className="week-compare">
        Stress: <strong className={`stress-${result.stress_level.toLowerCase()}`}>{result.stress_level}</strong>
        {" "}· Band: {result.wlb_band}
      </div>
    </div>
  );
}

export default function Simulator() {
  const [baseline, setBaseline] = useState(null);
  const [values, setValues] = useState(null);
  const [sim, setSim] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/logs")
      .then((res) => {
        const latest = res.data[0];
        if (!latest) {
          setError("Add a daily record first, then come back to try scenarios.");
          return;
        }
        const start = {
          sleep_hours: latest.sleep_hours,
          working_hours: latest.working_hours,
          activity_minutes: latest.activity_minutes,
          water_litres: latest.water_litres,
          meal_regularity: latest.meal_regularity,
        };
        setBaseline(start);
        setValues(start);
      })
      .catch(() => setError("Could not load your latest record."));
  }, []);

  const update = (key, val) => {
    setValues({ ...values, [key]: val });
    setSim(null);
  };

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/simulate", { baseline, scenario: values });
      setSim(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not run the scenario.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setValues(baseline);
    setSim(null);
  };

  if (!values) {
    return error
      ? <div className="card auth-card"><div className="alert error">{error}</div></div>
      : <p>Loading your latest record...</p>;
  }

  const sp = sim ? sim.change.score_points : 0;

  return (
    <div>
      <div className="card">
        <h2 style={{ marginTop: 0, color: "#1e6f5c" }}>What-if simulator</h2>
        <p className="muted" style={{ textAlign: "left" }}>
          Change the habits below to see how they could change your estimated stress and balance score.
          Your records are not changed.
        </p>

        {error && <div className="alert error">{error}</div>}

        <Slider label="Sleep" name="sleep_hours" value={values.sleep_hours}
          min={0} max={12} step={0.5} unit="h" onChange={update} />
        <Slider label="Working hours" name="working_hours" value={values.working_hours}
          min={0} max={16} step={0.5} unit="h" onChange={update} />
        <Slider label="Physical activity" name="activity_minutes" value={values.activity_minutes}
          min={0} max={180} step={5} unit="min" onChange={update} />
        <Slider label="Water intake" name="water_litres" value={values.water_litres}
          min={0} max={5} step={0.1} unit="L" onChange={update} />

        <label>Meal regularity</label>
        <select
          name="meal_regularity"
          value={values.meal_regularity}
          onChange={(e) => update("meal_regularity", e.target.value)}
        >
          {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <div className="sim-actions">
          <button type="button" onClick={run} disabled={loading}>
            {loading ? "Checking..." : "Check this scenario"}
          </button>
          <button type="button" className="secondary" onClick={reset}>
            Reset to my latest record
          </button>
        </div>
      </div>

      {sim && (
        <>
          <div className="week-grid" style={{ marginTop: 20 }}>
            <ResultCard title="Your latest record (baseline)" result={sim.baseline} />
            <ResultCard title="This scenario (estimate)" result={sim.scenario} />
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <p className="result-line">
              Change:{" "}
              {sp === 0 ? (
                <span className="muted-inline">no change in score</span>
              ) : (
                <strong className={sp > 0 ? "trend-good" : "trend-bad"}>
                  {sp > 0 ? "▲" : "▼"} {Math.abs(sp)} points
                </strong>
              )}
              {"  "}({sim.change.stress_level})
            </p>

            {sim.biggest_benefit ? (
              <p className="result-line">
                <strong>Biggest single improvement:</strong> {sim.biggest_benefit.change}
                {" "}(+{sim.biggest_benefit.score_gain} points)
              </p>
            ) : (
              <p className="muted" style={{ textAlign: "left" }}>
                None of the four tested habits raises the score further from this scenario.
              </p>
            )}

            <p className="muted" style={{ textAlign: "left" }}>{sim.note}</p>
            <p className="muted" style={{ textAlign: "left" }}>{sim.disclaimer}</p>
          </div>
        </>
      )}
    </div>
  );
}