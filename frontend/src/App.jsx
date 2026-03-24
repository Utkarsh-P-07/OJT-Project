import { Routes, Route, Link, useLocation } from "react-router-dom";
import InputPage from "./pages/InputPage";
import Dashboard from "./pages/Dashboard";
import HowItWorks from "./pages/DescriptionPage";
import About from "./pages/AboutPage";

const NAV = [
  { path: "/", label: "Analyze" },
  { path: "/how-it-works", label: "How it works" },
  { path: "/dashboard", label: "Results" },
  { path: "/about", label: "About" },
];

export default function App() {
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav className="nav-bar">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-dot" />
          NewsDrift
        </Link>
        <div className="nav-links">
          {NAV.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link${pathname === path ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<InputPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>

      <footer className="site-footer">
        NewsDrift &mdash; OJT Project &mdash; Utkarsh Pandey, MSU 2024-28
      </footer>
    </div>
  );
}
