import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function QuickActions() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="quick-actions">
      <Link to="/daily" className="qa-btn">Daily Entry</Link>
      <Link to="/calendar" className="qa-btn">Calendar</Link>
      <Link to="/reports" className="qa-btn">Reports</Link>
      <button type="button" className="qa-btn qa-logout" onClick={handleLogout}>Logout</button>
    </div>
  );
}