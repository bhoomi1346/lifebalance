import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatWidget from "./ChatWidget";
import MusicPlayer from "./MusicPlayer";

const MENU = [
  { to: "/", label: "Dashboard" },
  { to: "/daily", label: "Daily Entry" },
  { to: "/calendar", label: "Calendar" },
  { to: "/simulator", label: "Simulator" },
  { to: "/reports", label: "Reports" },
  { to: "/connected", label: "Devices" },
  { to: "/profile", label: "Profile" },
  { to: "/account", label: "Account" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    logout();
    navigate("/login");
  };

  const items = user
    ? [...MENU, ...(user.role === "admin" ? [{ to: "/admin", label: "Admin" }] : [])]
    : [];

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-left">
          <button type="button" className="menu-btn" onClick={() => setOpen(!open)} aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
          <Link to="/" className="brand">Life Balance</Link>
        </div>
        {!user && (
          <div className="nav-right">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        )}
      </header>

      {open && <div className="drawer-overlay" onClick={close} />}

      <aside className={`drawer ${open ? "open" : ""}`}>
        {user ? (
          <>
            <div className="drawer-user">Hello, {user.name}</div>
            {items.map((item) => (
              <Link key={item.to} to={item.to} onClick={close}>{item.label}</Link>
            ))}
            <button type="button" className="secondary drawer-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={close}>Login</Link>
            <Link to="/register" onClick={close}>Register</Link>
          </>
        )}
      </aside>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        General wellness guidance only. Not medical advice or diagnosis.
      </footer>

      {user && <MusicPlayer />}
      {user && <ChatWidget />}
    </div>
  );
}