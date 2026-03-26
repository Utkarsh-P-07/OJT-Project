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
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", borderRadius: "16px", borderLeft: "4px solid var(--primary-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             🧠 1. Topic Classification
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            When you upload an article or extract text from a PDF/Image, your text immediately passes through a <strong>TF-IDF Vectorizer</strong> and a trained <strong>Logistic Regression</strong> model. 
            The system breaks your text down into mathematical weights, removing "stop words" and extracting core meaning. The model then maps your text against thousands of recognized patterns to confidently assign it a specific Topic label (e.g., "Sports", "World", "Technology").
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", borderRadius: "16px", borderLeft: "4px solid var(--accent-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             📈 2. Real-Time Trend Scoring
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            Ever wonder how "Trending" an article is? The backend actively fetches the last 50 news articles stored into our database and converts them into high-dimensional vectors. 
            By calculating the <strong>Cosine Similarity</strong> between your specific article and recent news events, it generates a Trend Score (out of 100). The higher the score, the more your article aligns with exactly what the world is talking about right now!
          </p>
        </div>

        {/* Section 3 */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", borderRadius: "16px", borderLeft: "4px solid var(--success-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
             📊 3. Predictive Dashboard Analytics
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
            The <strong>Insights & Trends</strong> dashboard doesn't just show history; it models the future. By clustering topics by timeframe (Week/Month) and fitting a Linear Regression model, the system identifies negative or positive sloped trajectories. Topics are then automatically labeled as <em>Increasing</em>, <em>Decreasing</em>, or <em>Stable</em> based on statistical trajectories, helping you pinpoint the next viral stories.
          </p>
        </div>

        {/* Section 4 */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "2rem", borderRadius: "16px", borderLeft: "4px solid var(--warning-color)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
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
