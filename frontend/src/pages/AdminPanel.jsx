import { useState, useEffect } from "react";
import axios from "axios";

export default function AdminPanel() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/dataset-summary");
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/admin/upload-dataset", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage({ type: "success", text: `Success! Uploaded ${res.data.count} articles.` });
      fetchSummary();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.detail || "Upload failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleApiFetch = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post("http://localhost:8000/admin/fetch-api-data");
      setMessage({ type: "success", text: `Success! Auto-labeled and saved ${res.data.count} live articles.` });
      fetchSummary();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.detail || "Live API fetch failed." });
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async (retrain = false) => {
    setLoading(true);
    setMessage(null);
    const endpoint = retrain ? "/admin/retrain-model" : "/admin/train-model";

    try {
      const res = await axios.post(`http://localhost:8000${endpoint}`);
      setMessage({ type: "success", text: res.data.message });
      fetchSummary();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.detail || "Training failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <h1 className="page-title">Admin Dashboard</h1>

      {summary && (
        <div className="grid-2" style={{ marginBottom: "2rem", gap: "2rem" }}>
           <div className="score-card" style={{ padding: "1.5rem" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase" }}>Core ML Dataset</div>
              <div className="score-value" style={{ margin: "0.5rem 0", fontSize: "3rem" }}>{summary.total_articles}</div>
              <div className="badge badge-topic" style={{ marginTop: "0.5rem", width: "fit-content", margin: "0 auto" }}>
                {summary.unique_ml_topics ?? 4} Rigid Base Categories
              </div>
           </div>
           
           <div className="score-card" style={{ padding: "1.5rem", borderTop: "3px solid var(--success-color)" }}>
              <div style={{ color: "var(--success-color)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "bold" }}>Live Trend Pool</div>
              <div className="score-value" style={{ margin: "0.5rem 0", fontSize: "3rem", color: "var(--text-main)" }}>{summary.api_articles_count ?? 0}</div>
              <div className="badge badge-topic" style={{ marginTop: "0.5rem", width: "fit-content", margin: "0 auto", color: "var(--success-color)", border: "1px solid var(--success-color)", background: "#f0faf0" }}>
                 {summary.unique_api_topics ?? 0} Dynamic Live Categories
              </div>
           </div>
        </div>
      )}

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* CSV UPLOAD FORM */}
        <form onSubmit={handleUpload}>
          <div className="file-upload-zone" onClick={() => document.getElementById("csvUpload").click()}>
            <h2>Upload CSV Dataset</h2>
            <p>{file ? file.name : "Must have 'date', 'text', and 'topic' columns."}</p>
            <input
              id="csvUpload"
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <button className="btn" type="submit" disabled={!file || loading}>
              {loading ? "..." : "Upload & Save CSV"}
            </button>
          </div>
        </form>

        {/* LIVE API SYNC BLOCK */}
        <div 
          className="file-upload-zone" 
          onClick={loading ? null : handleApiFetch} 
          style={{ 
            marginTop: "2rem", 
            borderStyle: "dashed", 
            borderColor: "rgba(63, 185, 80, 0.4)",
            background: "rgba(63, 185, 80, 0.02)",
            cursor: loading ? "default" : "pointer",
            padding: "2rem"
          }}
        >
          <h2 style={{ color: "var(--success-color)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: 0, fontSize: "1.5rem" }}>
            🌐 Fetch Live API Data
          </h2>
          <p style={{ marginTop: "10px" }}>Automatically pull and label real-time headlines directly from the web.</p>
        </div>

        {/* TRAINING CONTROLS */}
        <div style={{ marginTop: "3rem", padding: "2rem", background: "#f8f9fa", borderRadius: "8px", textAlign: "center", border: "1px solid #e9ecef" }}>
          <h3 style={{ marginBottom: "1.5rem", color: "var(--text-main)" }}>Core Model Controls</h3>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button className="btn" type="button" onClick={() => trainModel(false)} disabled={loading} style={{ background: "var(--primary-color)" }}>
              Train Model
            </button>
            <button className="btn" type="button" onClick={() => trainModel(true)} disabled={loading} style={{ background: "var(--danger-color)" }}>
              Retrain Iteration
            </button>
          </div>
        </div>

        {loading && <div className="loader" style={{ marginTop: "2rem" }} />}

        {message && (
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              borderRadius: "8px",
              background: message.type === "success" ? "rgba(63, 185, 80, 0.1)" : "rgba(248, 81, 73, 0.1)",
              border: `1px solid ${message.type === "success" ? "var(--success-color)" : "var(--danger-color)"}`,
              color: message.type === "success" ? "var(--success-color)" : "var(--danger-color)",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
