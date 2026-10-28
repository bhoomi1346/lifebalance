import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatWidget from "./ChatWidget";
import MusicPlayer from "./MusicPlayer";
import Icon from "./Icon";

const MENU = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/daily", label: "Daily Entry", icon: "daily" },
  { to: "/calendar", label: "Calendar", icon: "calendar" },
  { to: "/simulator", label: "Simulator", icon: "simulator" },
  { to: "/reports", label: "Reports", icon: "reports" },
  { to: "/connected", label: "Devices", icon: "devices" },
  { to: "/profile", label: "Profile", icon: "profile" },
  { to: "/account", label: "Account", icon: "account" },
];

const FOOT = "General wellness guidance only. Not medical advice or diagnosis.";

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

  // Guests: only the name on the left, Login and Register on the right
  if (!user) {
    return (
      <div className="app">
        <header className="navbar">
          <Link to="/home" className="brand">Life Balance</Link>
          <nav className="nav-right">
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/register" className="nav-btn nav-btn-solid">Register</Link>
          </nav>
        </header>
        <main className="content">
          <Outlet />
        </main>
        <footer className="footer">{FOOT}</footer>
      </div>
    );
  }

  const items = [
    ...MENU,
    ...(user.role === "admin" ? [{ to: "/admin", label: "Admin", icon: "admin" }] : []),
  ];

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

        <nav className="nav-quick">
          <Link to="/daily" className="nq">
            <Icon name="daily" size={16} />
            <span className="nq-label">Daily Entry</span>
          </Link>
          <Link to="/calendar" className="nq">
            <Icon name="calendar" size={16} />
            <span className="nq-label">Calendar</span>
          </Link>
          <Link to="/reports" className="nq">
            <Icon name="reports" size={16} />
            <span className="nq-label">Reports</span>
          </Link>
          <button type="button" className="nq nq-logout" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            <span className="nq-label">Logout</span>
          </button>
        </nav>
      </header>

      {open && <div className="drawer-overlay" onClick={close} />}

      <aside className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-user">Hello, <strong>{user.name}</strong></div>
        {items.map((item) => (
          <Link key={item.to} to={item.to} onClick={close}>
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button type="button" className="secondary drawer-logout" onClick={handleLogout}>
          <Icon name="logout" size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">{FOOT}</footer>

      <MusicPlayer />
      <ChatWidget />
    </div>
  );
}