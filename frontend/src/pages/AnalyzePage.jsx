import { useState } from "react";
import axios from "axios";

export default function AnalyzePage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!text && !file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/user/analyze-article", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <h1 className="page-title">Article Analysis</h1>

      <div className="grid-2">
        <div>
          <h2 className="section-title">Input Source</h2>
          <form onSubmit={handleAnalyze}>
            <textarea
              className="text-area"
              placeholder="Paste article text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />

            <div style={{ textAlign: "center", margin: "1rem 0", color: "var(--text-muted)" }}>
              OR UPLOAD A FILE
            </div>

            <div className="file-upload-zone" onClick={() => document.getElementById("singleUpload").click()}>
              <p>{file ? file.name : "Select a PDF, PNG, or JPG"}</p>
              <input
                id="singleUpload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <button
              className="btn"
              type="submit"
              disabled={(!text && !file) || loading}
              style={{ width: "100%", marginTop: "2rem" }}
            >
              {loading ? "Analyzing..." : "Analyze Now"}
            </button>
          </form>

          {loading && <div className="loader" />}
          {error && <div style={{ color: "var(--danger-color)", marginTop: "1rem" }}>{error}</div>}
        </div>

        <div>
           {result ? (
            <div className="glass-panel style-pop" style={{ background: "#ffffff", border: "1px solid #e9ecef", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
              <h2 className="section-title">Results</h2>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Topic Classification</div>
                <div className="badge badge-topic" style={{ fontSize: "1.2rem", marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
                  {result.topic}
                </div>
              </div>

              <div className="score-card">
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Topic Drift Score (PSI)</div>
                <div className={`score-value`} style={{ fontSize: "2.5rem", fontWeight: "bold",
                  color: result.drift_label?.includes('High') ? "var(--danger-color)" : 
                         result.drift_label?.includes('Moderate') ? "var(--warning-color)" : 
                         "var(--success-color)" 
                }}>
                  {result.drift_score?.toFixed(3) || "0.000"}
                </div>
                <div className="badge" style={{ marginTop: "0.5rem" }}>
                  {result.drift_label}
                </div>
              </div>
              
              <div className="score-card" style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Category Text Similarity</div>
                <div className={`score-value`} style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent-color)" }}>
                  {result.category_similarity?.toFixed(1) || "0.0"} <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>/100</span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  (Compared strictly against live {result.topic} articles)
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Extracted Text Context</h3>
                <div style={{ background: "#fafafa", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem", color: "var(--text-main)", fontStyle: "italic", whiteSpace: "pre-wrap", border: "1px solid #e9ecef" }}>
                  "{result.original_text}"
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: "2rem", border: "1px dashed var(--border-color)", borderRadius: "12px" }}>
              Submit an article to see its Topic Classification, Topic Drift Score (PSI), and Category-Specific Text Similarity against live web streams.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
