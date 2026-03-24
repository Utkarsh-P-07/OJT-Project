import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { getResults } from "../services/api";

export default function Dashboard() {
  const location = useLocation();
  const nav = useNavigate();

  // if we just ran an analysis, results come through nav state
  // otherwise fetch the last saved run
  const [results, setResults] = useState(location.state?.results || null);
  const [loading, setLoading] = useState(!location.state?.results);
  const srcLabel = location.state?.src || "last saved run";

  useEffect(() => {
    if (results !== null) return;
    getResults()
      .then(res => setResults(res.data.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Loading results...</span>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="empty-state">
        <p>No results yet — run an analysis first.</p>
        <button onClick={() => nav("/")} className="btn">Go to Analyze</button>
      </div>
    );
  }

  const driftCount  = results.filter(r => r.drift_detected).length;
  const stableCount = results.length - driftCount;
  const avgSim = (results.reduce((a, r) => a + r.similarity, 0) / results.length).toFixed(3);
  const minSim = Math.min(...results.map(r => r.similarity)).toFixed(3);

  const chartData = results.map((r, i) => ({
    label: r.from_date || r.period || `P${i + 1}`,
    sim:   r.similarity,
    drift: r.drift_detected,
  }));

  return (
    <div style={{ maxWidth: 920 }}>
      <div className="dash-header">
        <div>
          <h1>Results</h1>
          <p className="src-label">Source: {srcLabel}</p>
        </div>
        <button onClick={() => nav("/")} className="btn sm">New analysis</button>
      </div>

      {driftCount > 0 && (
        <div className="drift-banner">
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p>{driftCount} drift event{driftCount > 1 ? "s" : ""} detected out of {results.length} periods — lowest similarity was {minSim}</p>
        </div>
      )}

      <div className="stat-row">
        <StatCard label="periods"        value={results.length} color="#c8d8e8" />
        <StatCard label="drift events"   value={driftCount}     color={driftCount > 0 ? "#c05050" : "#3a7a3a"} />
        <StatCard label="stable"         value={stableCount}    color="#3a7a3a" />
        <StatCard label="avg similarity" value={avgSim}         color="#5a8ae0" />
        <StatCard label="lowest score"   value={minSim}         color="#a06020" />
      </div>

      {/* line chart */}
      <div className="card">
        <p className="card-label">Similarity over time</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 6, right: 14, left: -18, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#111e30" />
            <XAxis dataKey="label" tick={{ fill: "#2d4a6a", fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fill: "#2d4a6a", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={0.3}
              stroke="#4a1818"
              strokeDasharray="4 3"
              label={{ value: "threshold", fill: "#4a1818", fontSize: 10, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="sim"
              stroke="#1e4a8a"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => {
                const c = payload.drift ? "#d06060" : "#4a8a4a";
                return <circle key={`d${cx}`} cx={cx} cy={cy} r={4} fill={c} stroke={c} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="chart-legend">
          red = drift &nbsp;·&nbsp; green = stable &nbsp;·&nbsp; dashed = threshold (0.3)
        </p>
      </div>

      {/* bar chart — same data, different view */}
      <div className="card">
        <p className="card-label">Per-period similarity</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 14, left: -18, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#111e30" />
            <XAxis dataKey="label" tick={{ fill: "#2d4a6a", fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fill: "#2d4a6a", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0.3} stroke="#4a1818" strokeDasharray="4 3" />
            <Bar dataKey="sim" radius={[3, 3, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.sim < 0.3 ? "#3a0e0e" : "#0f2848"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* table */}
      <div className="card">
        <p className="card-label">Full breakdown</p>
        <div style={{ overflowX: "auto" }}>
          <table className="results-table">
            <thead>
              <tr>
                {["#", "From", "To", "Score", "Status"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.from_date || r.period || "—"}</td>
                  <td>{r.to_date || "—"}</td>
                  <td>
                    <div className="score-bar-wrap">
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${r.similarity * 100}%`,
                          background: r.drift_detected ? "#2a0808" : "#081828",
                        }}
                      />
                      <span className="score-bar-val">{r.similarity}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${r.drift_detected ? "drift" : "stable"}`}>
                      {r.drift_detected ? "drift" : "stable"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const isDrift = typeof val === "number" && val < 0.3;
  return (
    <div style={{ background: "#0b1929", border: "1px solid #111e30", borderRadius: 5, padding: "7px 11px", fontSize: 12 }}>
      <p style={{ color: "#5a7a9a", marginBottom: 3 }}>{label}</p>
      <p style={{ color: isDrift ? "#d06060" : "#4a8a4a" }}>
        similarity: <strong>{typeof val === "number" ? val.toFixed(4) : val}</strong>
      </p>
      <p style={{ color: isDrift ? "#d06060" : "#4a8a4a", fontSize: 11, marginTop: 1 }}>
        {isDrift ? "drift detected" : "stable"}
      </p>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <p className="stat-val" style={{ color }}>{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
