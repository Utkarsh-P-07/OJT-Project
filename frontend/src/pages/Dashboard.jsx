import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { getResults, getHistory, deleteRun, getStats } from "../services/api";

export default function Dashboard() {
  const location = useLocation();
  const nav = useNavigate();

  const fromNav = location.state?.results;

  const [results, setResults]         = useState(fromNav || null);
  const [loading, setLoading]         = useState(!fromNav);
  const [fetchErr, setFetchErr]       = useState("");       // surface backend errors
  const [history, setHistory]         = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [globalStats, setGlobalStats] = useState(null);

  // threshold/groupBy come from nav state on fresh runs,
  // or from the loaded run's metadata when browsing history
  const [threshold, setThreshold] = useState(location.state?.threshold ?? 0.3);
  const [groupBy, setGroupBy]     = useState(location.state?.groupBy || "day");
  const [srcLabel, setSrcLabel]   = useState(location.state?.src || "last saved run");

  useEffect(() => {
    // if we came from a fresh analysis, results are already in state
    if (!fromNav) {
      setFetchErr("");
      getResults()
        .then(res => {
          const data = res.data.results || [];
          if (data.length === 0) {
            setFetchErr("No saved runs found. Run an analysis first.");
          }
          setResults(data);
        })
        .catch(err => {
          const msg = err.response?.data?.detail || err.message || "Could not reach the backend.";
          setFetchErr(msg);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }

    // always load history and stats in the background
    getHistory(20)
      .then(res => setHistory(res.data.runs || []))
      .catch(() => {});

    getStats()
      .then(res => setGlobalStats(res.data))
      .catch(() => {});
  }, []);

  // load a specific run from history and restore its metadata
  function loadRun(run) {
    setLoading(true);
    setFetchErr("");
    getResults(run.run_id)
      .then(res => {
        const data = res.data.results || [];
        setResults(data);
        // restore the threshold and source from the run summary
        setThreshold(run.threshold ?? 0.3);
        setSrcLabel(run.source || run.run_id);
        setGroupBy(run.group_by || "day");
      })
      .catch(err => {
        setFetchErr(err.response?.data?.detail || "Failed to load run.");
        setResults([]);
      })
      .finally(() => setLoading(false));
    setShowHistory(false);
  }

  async function handleDeleteRun(e, runId) {
    e.stopPropagation();
    if (!window.confirm("Delete this run from history?")) return;
    try {
      await deleteRun(runId);
      setHistory(prev => prev.filter(r => r.run_id !== runId));
    } catch { /* not critical */ }
  }

  function exportCSV() {
    if (!results?.length) return;
    const header = "from_date,to_date,similarity,drift_detected,from_count,to_count,from_terms,to_terms";
    const rows = results.map(r =>
      [
        r.from_date || "",
        r.to_date   || "",
        r.similarity,
        r.drift_detected,
        r.from_count ?? "",
        r.to_count   ?? "",
        (r.from_terms || []).join("|"),
        (r.to_terms   || []).join("|"),
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drift_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Loading results from database...</span>
      </div>
    );
  }

  // ── Error / empty state ────────────────────────────────────────────────────
  if (!results || results.length === 0) {
    return (
      <div className="empty-state">
        {fetchErr ? (
          <>
            <div className="err-box" style={{ maxWidth: 480, marginBottom: 20 }}>
              {fetchErr}
            </div>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
              Make sure the backend is running at <code>http://localhost:8000</code>
            </p>
          </>
        ) : (
          <p>No results yet — run an analysis first.</p>
        )}

        {/* show history if we have past runs even when latest fetch failed */}
        {history.length > 0 && (
          <div style={{ marginTop: 24, maxWidth: 640 }}>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
              Or load a previous run:
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="results-table">
                <thead>
                  <tr>
                    {["Run ID", "Source", "Date", "Periods", "Drifts", ""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(run => (
                    <tr key={run.run_id} style={{ cursor: "pointer" }} onClick={() => loadRun(run)}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{run.run_id}</td>
                      <td>{run.source || "—"}</td>
                      <td>{run.created_at ? run.created_at.slice(0, 10) : "—"}</td>
                      <td>{run.total_periods}</td>
                      <td style={{ color: run.drift_count > 0 ? "#dc2626" : "#16a34a" }}>{run.drift_count}</td>
                      <td>
                        <button className="btn sm" onClick={() => loadRun(run)}>Load</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          <button onClick={() => nav("/")} className="btn">Go to Analyze</button>
          {!fetchErr && (
            <button
              className="btn"
              onClick={() => {
                setLoading(true);
                getResults()
                  .then(res => setResults(res.data.results || []))
                  .catch(() => setFetchErr("Still can't reach the backend."))
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  const driftCount  = results.filter(r => r.drift_detected).length;
  const stableCount = results.length - driftCount;
  const avgSim = (results.reduce((a, r) => a + r.similarity, 0) / results.length).toFixed(3);
  const minSim = Math.min(...results.map(r => r.similarity)).toFixed(3);
  const totalArticles = results.reduce((a, r) => a + (r.from_count || 0), 0)
    + (results[results.length - 1]?.to_count || 0);

  const chartData = results.map((r, i) => ({
    label: r.from_date || r.period || `P${i + 1}`,
    sim:   r.similarity,
    drift: r.drift_detected,
  }));

  return (
    <div style={{ maxWidth: 960 }}>
      {/* header */}
      <div className="dash-header">
        <div>
          <h1>Results</h1>
          <p className="src-label">
            {srcLabel} &nbsp;·&nbsp; grouped by {groupBy}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {history.length > 0 && (
            <button onClick={() => setShowHistory(v => !v)} className="btn sm">
              {showHistory ? "Hide history" : `History (${history.length})`}
            </button>
          )}
          <button onClick={exportCSV} className="btn sm">Export CSV</button>
          <button onClick={() => nav("/")} className="btn sm">New analysis</button>
        </div>
      </div>

      {/* history panel */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="card-label">Past runs</p>
          <div style={{ overflowX: "auto" }}>
            <table className="results-table">
              <thead>
                <tr>
                  {["Run ID", "Source", "Date", "Periods", "Drifts", "Threshold", ""].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(run => (
                  <tr key={run.run_id} style={{ cursor: "pointer" }} onClick={() => loadRun(run)}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{run.run_id}</td>
                    <td>{run.source || "—"}</td>
                    <td>{run.created_at ? run.created_at.slice(0, 10) : "—"}</td>
                    <td>{run.total_periods}</td>
                    <td style={{ color: run.drift_count > 0 ? "#dc2626" : "#16a34a" }}>{run.drift_count}</td>
                    <td>{run.threshold}</td>
                    <td>
                      <button
                        className="btn sm danger"
                        onClick={e => handleDeleteRun(e, run.run_id)}
                        style={{ padding: "3px 8px", fontSize: 11 }}
                      >
                        delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Click a row to load that run.</p>
        </div>
      )}

      {/* drift banner */}
      {driftCount > 0 && (
        <div className="drift-banner">
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p>
            {driftCount} drift event{driftCount > 1 ? "s" : ""} detected out of {results.length} periods
            — lowest similarity was {minSim}
          </p>
        </div>
      )}

      {/* stat cards */}
      <div className="stat-row">
        <StatCard label="periods"        value={results.length}  color="#1e293b" />
        <StatCard label="drift events"   value={driftCount}      color={driftCount > 0 ? "#dc2626" : "#16a34a"} />
        <StatCard label="stable"         value={stableCount}     color="#16a34a" />
        <StatCard label="avg similarity" value={avgSim}          color="#2563eb" />
        <StatCard label="lowest score"   value={minSim}          color="#d97706" />
        {totalArticles > 0 && (
          <StatCard label="total articles" value={totalArticles} color="#7c3aed" />
        )}
      </div>

      {/* global stats banner */}
      {globalStats && globalStats.total_runs > 1 && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
          <span>All-time runs: <strong style={{ color: "#1e293b" }}>{globalStats.total_runs}</strong></span>
          <span>All-time drifts: <strong style={{ color: globalStats.total_drifts > 0 ? "#dc2626" : "#16a34a" }}>{globalStats.total_drifts}</strong></span>
          {globalStats.worst_transition && (
            <span>
              Worst transition: <strong style={{ color: "#dc2626" }}>{globalStats.worst_transition.similarity}</strong>
              {globalStats.worst_transition.from_date && (
                <span style={{ color: "#94a3b8" }}> ({globalStats.worst_transition.from_date} → {globalStats.worst_transition.to_date})</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* line chart */}
      <div className="card">
        <p className="card-label">Similarity over time</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 6, right: 14, left: -18, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip threshold={threshold} />} />
            <ReferenceLine
              y={threshold}
              stroke="#fca5a5"
              strokeDasharray="4 3"
              label={{ value: `threshold (${threshold})`, fill: "#ef4444", fontSize: 10, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="sim"
              stroke="#93c5fd"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => {
                const c = payload.drift ? "#ef4444" : "#16a34a";
                return <circle key={`d${cx}`} cx={cx} cy={cy} r={4} fill={c} stroke={c} />;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="chart-legend">
          red = drift &nbsp;·&nbsp; green = stable &nbsp;·&nbsp; dashed = threshold ({threshold})
        </p>
      </div>

      {/* bar chart */}
      <div className="card">
        <p className="card-label">Per-period similarity</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 14, left: -18, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip threshold={threshold} />} />
            <ReferenceLine y={threshold} stroke="#fca5a5" strokeDasharray="4 3" />
            <Bar dataKey="sim" radius={[3, 3, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.drift ? "#fecaca" : "#bfdbfe"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* breakdown table */}
      <div className="card">
        <p className="card-label">Full breakdown</p>
        <div style={{ overflowX: "auto" }}>
          <table className="results-table">
            <thead>
              <tr>
                {["#", "From", "To", "Articles", "Score", "Status", "From topics", "To topics"].map(h => (
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
                  <td style={{ color: "#64748b", fontSize: 12 }}>
                    {r.from_count != null ? `${r.from_count} → ${r.to_count}` : "—"}
                  </td>
                  <td>
                    <div className="score-bar-wrap">
                      <div
                        className="score-bar-fill"
                        style={{ width: `${r.similarity * 100}%`, background: r.drift_detected ? "#fecaca" : "#bfdbfe" }}
                      />
                      <span className="score-bar-val">{r.similarity}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${r.drift_detected ? "drift" : "stable"}`}>
                      {r.drift_detected ? "drift" : "stable"}
                    </span>
                  </td>
                  <td><TermPills terms={r.from_terms} /></td>
                  <td><TermPills terms={r.to_terms} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TermPills({ terms }) {
  if (!terms?.length) return <span style={{ color: "#cbd5e1", fontSize: 11 }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
      {terms.slice(0, 4).map(t => (
        <span key={t} style={{ fontSize: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 3, padding: "1px 5px", color: "#475569", whiteSpace: "nowrap" }}>
          {t}
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label, threshold = 0.3 }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  const isDrift = typeof val === "number" && val < threshold;
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 5, padding: "7px 11px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      <p style={{ color: "#64748b", marginBottom: 3 }}>{label}</p>
      <p style={{ color: isDrift ? "#dc2626" : "#16a34a" }}>
        similarity: <strong>{typeof val === "number" ? val.toFixed(4) : val}</strong>
      </p>
      <p style={{ color: isDrift ? "#dc2626" : "#16a34a", fontSize: 11, marginTop: 1 }}>
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
