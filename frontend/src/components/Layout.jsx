import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="brand">Life Balance</Link>
        <nav>
          {user ? (
            <>
              <Link to="/">Dashboard</Link>
              <Link to="/daily">Daily Entry</Link>
              <Link to="/profile">Profile</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        General wellness guidance only. Not medical advice or diagnosis.
      </footer>
    </div>
  );
}