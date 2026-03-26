import { Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import RoleSelectPage from "./pages/RoleSelectPage";
import AdminPanel from "./pages/AdminPanel";
import AnalyzePage from "./pages/AnalyzePage";
import DashboardPage from "./pages/DashboardPage";
import HowItWorksPage from "./pages/HowItWorksPage";

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("app_role"));

  useEffect(() => {
    // Set up axios interceptor globally to securely attach the x-user-role header.
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const currentRole = localStorage.getItem("app_role") || "";
      config.headers["x-user-role"] = currentRole;
      return config;
    });

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const handleSetRole = (newRole) => {
    localStorage.setItem("app_role", newRole);
    setRole(newRole);
    if (newRole === "admin") navigate("/admin");
    else navigate("/user/how-it-works");
  };

  const handleLogout = () => {
    localStorage.removeItem("app_role");
    setRole(null);
    navigate("/");
  };

  if (!role) {
    return <RoleSelectPage onSelectRole={handleSetRole} />;
  }

  const navLinks = role === "admin" 
    ? [{ path: "/admin", label: "Dataset & Model HQ" }]
    : [
        { path: "/user/how-it-works", label: "How It Works" },
        { path: "/user/analyze", label: "Article Analysis" },
        { path: "/user/dashboard", label: "Insights & Trends" }
      ];

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-brand" style={{ cursor: "default" }}>
          <span className="nav-brand-dot" />
          NewsDrift {role === "admin" ? "Admin" : "User"}
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link${pathname === path ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}
          <button 
            onClick={handleLogout} 
            className="btn" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', marginLeft: '1rem', background: 'rgba(255,255,255,0.1)' }}
          >
            Switch Role
          </button>
        </div>
      </nav>

      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to={role === "admin" ? "/admin" : "/user/how-it-works"} replace />} />
          
          {role === "admin" && (
            <Route path="/admin" element={<AdminPanel />} />
          )}

          {role === "user" && (
            <>
              <Route path="/user/how-it-works" element={<HowItWorksPage />} />
              <Route path="/user/analyze" element={<AnalyzePage />} />
              <Route path="/user/dashboard" element={<DashboardPage />} />
            </>
          )}

          {/* Fallback to root if path is wrong or unauthorized */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <footer>
        NewsDrift Pro &mdash; AI Topic & Trend Analysis Roles
      </footer>
    </div>
  );
}
