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
            <div className="glass-panel style-pop" style={{ background: "rgba(0,0,0,0.3)", border: "none" }}>
              <h2 className="section-title">Results</h2>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Topic Classification</div>
                <div className="badge badge-topic" style={{ fontSize: "1.2rem", marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
                  {result.topic}
                </div>
              </div>

              <div className="score-card">
                <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Trend Score</div>
                <div className={`score-value score-${result.trend_label.split(" ")[0].toLowerCase()}`}>
                  {result.trend_score.toFixed(1)}<span style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>/100</span>
                </div>
                <div className="badge" style={{ marginTop: "0.5rem" }}>
                  {result.trend_label}
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <h3 style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Extracted Text Context</h3>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem", color: "var(--text-main)", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                  "{result.original_text}"
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center", padding: "2rem", border: "1px dashed var(--border-color)", borderRadius: "12px" }}>
              Submit an article to see its Topic Classification and Trend Score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
