import { useEffect, useState } from "react";
import api from "../api";

const WORK_MODES = ["Remote", "Hybrid", "Office"];
const MARITAL_STATUSES = ["Married", "Unmarried", "Prefer not to say"];
const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"];

export default function Profile() {
  const [form, setForm] = useState({
    occupation: "",
    work_mode: "",
    marital_status: "",
    age_group: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/profile")
      .then((res) => {
        setForm({
          occupation: res.data.occupation || "",
          work_mode: res.data.work_mode || "",
          marital_status: res.data.marital_status || "",
          age_group: res.data.age_group || "",
        });
      })
      .catch(() => setError("Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const payload = {};
    Object.keys(form).forEach((key) => {
      if (form[key]) payload[key] = form[key];
    });

    setSaving(true);
    try {
      await api.put("/profile", payload);
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.response?.data?.error || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading your profile...</p>;

  return (
    <div className="card auth-card">
      <h2>Your profile</h2>
      <p className="muted" style={{ textAlign: "left", marginTop: 0 }}>
        These details help us make suggestions that fit your routine. They are not used to
        guess how stressed you are.
      </p>
      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Occupation</label>
        <input
          type="text"
          name="occupation"
          value={form.occupation}
          onChange={handleChange}
          placeholder="e.g. Software engineer, Teacher, Nurse"
        />

        <label>Work mode</label>
        <select name="work_mode" value={form.work_mode} onChange={handleChange}>
          <option value="">Select...</option>
          {WORK_MODES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <label>Marital status</label>
        <select name="marital_status" value={form.marital_status} onChange={handleChange}>
          <option value="">Select...</option>
          {MARITAL_STATUSES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <label>Age group</label>
        <select name="age_group" value={form.age_group} onChange={handleChange}>
          <option value="">Select...</option>
          {AGE_GROUPS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}