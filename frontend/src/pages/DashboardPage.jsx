import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [driftData, setDriftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDrift();
  }, []);

  const fetchDrift = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/user/get-drift");
      setDriftData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load drift data.");
    } finally {
      setLoading(false);
    }
  };

  const colors = ["#58a6ff", "#3fb950", "#d29922", "#f85149", "#a371f7", "#bc8cff"];

  const chartData = driftData && driftData.topics ? Object.entries(driftData.topics).map(([topic, data]) => ({
    name: topic,
    "Historical DB (%)": data.ref_pct,
    "Live API (%)": data.cur_pct,
  })) : [];

  return (
    <div className="glass-panel">
      <h1 className="page-title">Topic Drift Dashboard</h1>

      {loading ? (
        <div className="loader"></div>
      ) : error ? (
        <div style={{ color: "var(--danger-color)" }}>{error}</div>
      ) : driftData && driftData.topics && Object.keys(driftData.topics).length > 0 ? (
        <div>
          <div style={{ textAlign: "center", marginBottom: "3rem", padding: "2rem", background: "#f8f9fa", borderRadius: "12px", border: "1px solid #e9ecef" }}>
             <h2 style={{ fontSize: "1.2rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px" }}>System-Wide Concept Drift</h2>
             <div style={{ fontSize: "3.5rem", fontWeight: "bold", margin: "0.5rem 0", color: driftData.overall_psi >= 0.2 ? "var(--danger-color)" : driftData.overall_psi >= 0.1 ? "var(--warning-color)" : "var(--success-color)" }}>
               {driftData.overall_psi.toFixed(4)}
             </div>
             <div className="badge" style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>{driftData.status}</div>
             <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.95rem", opacity: 0.8 }}>
               ( Population Stability Index comparing base ML Dataset vs Live Streaming Context )
             </p>
          </div>

          <div className="grid-3" style={{ marginBottom: "3rem" }}>
            {Object.entries(driftData.topics).map(([topic, data], idx) => (
              <div key={topic} className="glass-panel" style={{ padding: "1.5rem", borderTop: `4px solid ${colors[idx % colors.length]}`}}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem" }}>{topic}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>PSI Score:</span> <strong>{data.psi.toFixed(4)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>KL Divergence:</span> <strong>{data.kl.toFixed(4)}</strong>
                </div>
                { data.psi >= 0.1 && <div className="badge" style={{marginTop:"1rem", background:"var(--danger-color)", color:"white", width: "100%", textAlign: "center", display: "block"}}>Significant Shift Detected</div>}
              </div>
            ))}
          </div>

          <h2 className="section-title">Topic Distribution Shift</h2>
          <div className="chart-container glass-panel" style={{ background: "#ffffff", border: "1px solid var(--border-color)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: "var(--text-main)"}} />
                <YAxis stroke="var(--text-muted)" tick={{fill: "var(--text-main)"}} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="Historical DB (%)" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Live API (%)" fill="#f85149" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: "3rem", border: "1px dashed var(--border-color)", borderRadius: "12px", background: "#fafafa" }}>
          Insufficient data available to compute strict reference drift. Ensure ML Dataset and Live API Dataset both have populated topic records.
        </div>
      )}
    </div>
  );
}
