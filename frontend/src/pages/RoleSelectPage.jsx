import React from "react";

export default function RoleSelectPage({ onSelectRole }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-color)"
    }}>
      <div className="glass-panel" style={{
        maxWidth: "600px",
        textAlign: "center"
      }}>
        <div className="nav-brand" style={{ display: "inline-flex", marginBottom: "2rem" }}>
          <span className="nav-brand-dot" />
          NewsDrift System
        </div>
        
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "var(--text-main)" }}>Select Your Role</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "3rem" }}>
          This system uses role-based access control. Please select your operational context to continue.
        </p>

        <div className="grid-2">
          <div 
            onClick={() => onSelectRole("admin")}
            style={{
              padding: "2rem",
              background: "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.2)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <h3 style={{ fontSize: "1.5rem", color: "var(--primary-color)", marginBottom: "0.5rem" }}>Admin HQ</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Manage dataset, train classification models, view internal stats.
            </p>
          </div>

          <div 
            onClick={() => onSelectRole("user")}
            style={{
              padding: "2rem",
              background: "rgba(139, 92, 246, 0.05)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 92, 246, 0.2)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <h3 style={{ fontSize: "1.5rem", color: "var(--accent-color)", marginBottom: "0.5rem" }}>User Portal</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Analyze articles, read topic drift insights, view predictions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
