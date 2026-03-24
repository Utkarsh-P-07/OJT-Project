import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getResults } from "../services/api";

export default function Dashboard() {
  const location = useLocation();
  const [results, setResults] = useState(location.state?.results || []);
  const [loading, setLoading] = useState(!location.state?.results);

  useEffect(() => {
    if (!location.state?.results) {
      getResults()
        .then((res) => setResults(res.data.results))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) return <p style={{ color: "#94a3b8" }}>Loading results...</p>;
  if (!results.length) return <p style={{ color: "#94a3b8" }}>No drift results found. Run an analysis first.</p>;

  const chartData = results.map((r) => ({
    period: r.from_date ? `${r.from_date}` : r.period,
    similarity: r.similarity,
    drift: r.drift_detected,
  }));

  const driftCount = results.filter((r) => r.drift_detected).length;

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Topic Drift Dashboard</h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        {driftCount} drift event{driftCount !== 1 ? "s" : ""} detected across {results.length} period{results.length !== 1 ? "s" : ""}
      </p>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Similarity Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <ReferenceLine y={0.3} stroke="#f87171" strokeDasharray="4 4" label={{ value: "Drift Threshold", fill: "#f87171", fontSize: 11 }} />
            <Line type="monotone" dataKey="similarity" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Period Results</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              {["From", "To", "Similarity", "Status"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ background: r.drift_detected ? "#1a0a0a" : "transparent" }}>
                <td style={styles.td}>{r.from_date || r.period}</td>
                <td style={styles.td}>{r.to_date || "-"}</td>
                <td style={styles.td}>{r.similarity}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, background: r.drift_detected ? "#7f1d1d" : "#14532d", color: r.drift_detected ? "#fca5a5" : "#86efac" }}>
                    {r.drift_detected ? "⚠ Drift" : "✓ Stable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" },
  cardTitle: { fontSize: "1.1rem", marginBottom: "1rem", color: "#cbd5e1" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "0.6rem 1rem", borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "0.85rem" },
  td: { padding: "0.6rem 1rem", borderBottom: "1px solid #1e293b", fontSize: "0.9rem" },
  badge: { padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 },
};
