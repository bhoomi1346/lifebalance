import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    consent: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.consent) {
      setError("Please tick the consent box to register.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        consent_given: true,
      });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.error || "Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>Create your account</h2>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Full name</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} required />
        
        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required />

        <label>Password (at least 8 characters)</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required />

        <label>Confirm password</label>
        <input type="password" name="confirm" value={form.confirm} onChange={handleChange} required />

        <label className="checkbox">
          <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} />
          <span>
            I agree that this app stores my profile and daily lifestyle data (sleep, work hours,
            activity, water, meals, mood and stress) to give me wellness insights. I can export or
            delete my data at any time.
          </span>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="muted">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}