import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import DailyEntry from "./pages/DailyEntry";
import Calendar from "./pages/Calendar";
import Simulator from "./pages/Simulator";
import Chat from "./pages/Chat";
import Reports from "./pages/Reports";
import ConnectedApps from "./pages/ConnectedApps";
import Admin from "./pages/Admin";
import Account from "./pages/Account";

// "/" shows the home page to guests and the dashboard to logged-in users
function Start() {
  const { user } = useAuth();
  return user ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Home />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Start />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/daily" element={<ProtectedRoute><DailyEntry /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/connected" element={<ProtectedRoute><ConnectedApps /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}