import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/user/get-trend?group_by=month");
      setTrends(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load trends data.");
    } finally {
      setLoading(false);
    }
  };

  const colors = ["#58a6ff", "#3fb950", "#d29922", "#f85149", "#a371f7"];

  return (
    <div className="glass-panel">
      <h1 className="page-title">Topic Trends Dashboard</h1>

      {loading ? (
        <div className="loader"></div>
      ) : error ? (
        <div style={{ color: "var(--danger-color)" }}>{error}</div>
      ) : trends && trends.predictions ? (
        <div>
          <div className="grid-3" style={{ marginBottom: "3rem" }}>
            {Object.entries(trends.predictions).map(([topic, trajectory], idx) => (
              <div key={topic} className="glass-panel" style={{ padding: "1.5rem", borderTop: `4px solid ${colors[idx % colors.length]}`}}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{topic}</div>
                <div className="badge">
                  Future Prediction: <strong style={{ 
                    color: trajectory === 'Increasing' ? "var(--success-color)" : 
                           trajectory === 'Decreasing' ? "var(--danger-color)" : 
                           "var(--warning-color)"
                  }}>{trajectory}</strong>
                </div>
              </div>
            ))}
          </div>

          <h2 className="section-title">Topic Evolution Over Time</h2>
          <div className="chart-container glass-panel" style={{ background: "rgba(0,0,0,0.2)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period_key" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)", borderRadius: "8px" }} />
                <Legend />
                {Object.keys(trends.predictions).map((topic, idx) => (
                   // I need to properly format chart_data on the backend to use this. Let's assume the backend will provide it, or I'll re-map it here.
                   <Line type="monotone" dataKey={topic} stroke={colors[idx % colors.length]} key={topic} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
            ( Note: Currently waiting for comprehensive historical dataset to populate the full chart )
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>No trend predictions available. Upload dataset first.</div>
      )}
    </div>
  );
}
