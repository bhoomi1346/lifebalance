import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";

const FEATURES = [
  { icon: "daily", title: "Log your day in a minute", text: "Sleep, work, activity, water and meals. No long forms." },
  { icon: "dashboard", title: "See your balance at a glance", text: "Today's stress estimate, a balance score and simple charts." },
  { icon: "chat", title: "Gentle suggestions", text: "Small, practical tips that fit your work and routine." },
  { icon: "simulator", title: "Try a change first", text: "See how an extra hour of sleep could change your score." },
  { icon: "calendar", title: "Follow your progress", text: "A calendar and weekly reports show how your habits change." },
  { icon: "devices", title: "Connect your watch app", text: "Import sleep and activity data, with your permission." },
];

const STEPS = ["Create a free account", "Log how your day went", "Read your result and try one small change"];

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="card home-hero">
        <div className="breathe-dot" />
        <h1>Find your balance, one day at a time</h1>
        <p>
          A calm space to notice how work, sleep and rest are affecting you,
          with gentle, practical ideas to help.
        </p>
        <div className="quick-actions cta-row">
          {user ? (
            <Link to="/" className="qa-btn primary-link">Open my dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="qa-btn primary-link">Get started</Link>
              <Link to="/login" className="qa-btn">I have an account</Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div className="feature" key={f.title}>
            <div className="f-icon"><Icon name={f.icon} size={24} /></div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2>How it works</h2>
        <div className="feature-grid">
          {STEPS.map((s, i) => (
            <div className="feature" key={s}>
              <div className="step-num">{i + 1}</div>
              <p className="step-text">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card home-bottom">
        <h2>Ready to begin?</h2>
        <div className="quick-actions cta-row">
          {user ? (
            <Link to="/" className="qa-btn primary-link">Open my dashboard</Link>
          ) : (
            <>
              <Link to="/register" className="qa-btn primary-link">Register</Link>
              <Link to="/login" className="qa-btn">Login</Link>
            </>
          )}
        </div>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        This is general wellness guidance, not medical advice or diagnosis.
        If you feel unsafe, call Tele-MANAS on 14416 (India), or 112 in an emergency.
      </p>
    </div>
  );
}