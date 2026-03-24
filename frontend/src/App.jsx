import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import InputPage from "./pages/InputPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <nav style={styles.nav}>
        <span style={styles.brand}>📰 News Drift Detector</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link to="/">Analyze</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<InputPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1rem 2rem", background: "#1e293b", borderBottom: "1px solid #334155",
  },
  brand: { fontWeight: 700, fontSize: "1.1rem" },
  main: { padding: "2rem", maxWidth: "960px", margin: "0 auto" },
};
