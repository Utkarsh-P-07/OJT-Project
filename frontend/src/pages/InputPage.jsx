import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { detectDrift } from "../services/api";

export default function InputPage() {
  const [file, setFile] = useState(null);
  const [threshold, setThreshold] = useState(0.3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please select a CSV file.");
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await detectDrift(formData, threshold);
      navigate("/dashboard", { state: { results: res.data.results } });
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Check the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Analyze News Topic Drift</h1>
      <p style={styles.sub}>Upload a CSV with <code>date</code> and <code>text</code> columns.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>CSV File</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.input}
        />

        <label style={styles.label}>Drift Threshold: <strong>{threshold}</strong></label>
        <input
          type="range" min="0.1" max="0.9" step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <p style={styles.hint}>Lower = more sensitive to drift</p>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? "Analyzing..." : "Detect Drift"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: "560px", margin: "0 auto" },
  title: { fontSize: "1.8rem", marginBottom: "0.5rem" },
  sub: { color: "#94a3b8", marginBottom: "2rem" },
  form: { background: "#1e293b", padding: "2rem", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontWeight: 600, marginTop: "0.5rem" },
  input: { padding: "0.6rem", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", marginBottom: "0.5rem" },
  hint: { color: "#64748b", fontSize: "0.8rem", marginBottom: "0.5rem" },
  error: { color: "#f87171", fontSize: "0.9rem" },
  btn: { marginTop: "1rem", padding: "0.75rem", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "1rem" },
};
