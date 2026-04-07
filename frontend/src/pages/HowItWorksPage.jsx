import React from "react";

export default function HowItWorksPage() {
  return (
    <div className="glass-panel" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h1 className="page-title">How It Works</h1>
      <p style={{ fontSize: "1.15rem", color: "var(--text-muted)", marginBottom: "3rem" }}>
        Welcome to your powerful AI-driven news topic platform. Here is exactly what is happening behind the scenes when you analyze articles or view dashboard trends.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Section 1 */}
        <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "8px", borderLeft: "4px solid var(--primary-color)", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             🧠 1. Topic Classification
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            When you upload an article or extract text from a PDF/Image, your text immediately passes through a <strong>TF-IDF Vectorizer</strong> and a trained <strong>Logistic Regression</strong> model. 
            The system breaks your text down into mathematical weights, removing "stop words" and extracting core meaning. The model then maps your text against thousands of recognized patterns to confidently assign it a specific Topic label (e.g., "Sports", "World", "Technology").
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "8px", borderLeft: "4px solid var(--accent-color)", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             📈 2. Topic Concept Drift (PSI & KL)
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            Ever wonder if the media narrative is shifting? The backend actively fetches real-world Live API news and compares the current topic distributions against your historical master dataset. 
            By calculating the <strong>Population Stability Index (PSI)</strong> and <strong>Kullback-Leibler (KL) Divergence</strong>, it generates a strict Drift Score. A high score means the current news stream has fundamentally diverged from historical norms!
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "8px", borderLeft: "4px solid var(--success-color)", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             📊 3. Statistical Drift Dashboard
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            The <strong>Topic Drift Dashboard</strong> actively compares baseline distributions with the current landscape side-by-side. Rather than abstract trajectories, it computes the exact PSI and KL metrics for every individual topic, flagging anomalies visually. This allows you to instantly pinpoint not just what the topic is, but whether its structural frequency is currently experiencing a significant global shift.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "8px", borderLeft: "4px solid var(--warning-color)", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             🔒 4. Role Isolation
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            As a User, you are insulated from data injection and modification. Only the system <strong>Administrators</strong> have the authority to securely upload new master datasets, alter historical records, or run explicit Retraining algorithms directly modifying the intelligence of the machine learning classifier model protecting the integrity of your results.
          </p>
        </div>
      </div>
    </div>
  );
}
