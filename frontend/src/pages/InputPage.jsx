import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { detectDrift } from "../services/api";
import { extractTextFromPDF } from "../utils/pdfParser";

export default function InputPage() {
  const [entries, setEntries]     = useState([]);
  const [threshold, setThreshold] = useState(0.3);
  const [groupBy, setGroupBy]     = useState("day");
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState("");
  const [dragging, setDragging]   = useState(false);
  const inputRef = useRef();
  const nav = useNavigate();

  function pickFiles(fileList) {
    const added = [];
    for (const f of fileList) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (ext !== "csv" && ext !== "pdf") continue;
      added.push({ id: Math.random().toString(36).slice(2), file: f, type: ext, date: "" });
    }
    if (!added.length) { setErr("Only CSV or PDF files are supported."); return; }
    setErr("");
    setEntries(prev => [...prev, ...added]);
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    pickFiles(Array.from(e.dataTransfer.files));
  }, []);

  function removeFile(id) { setEntries(prev => prev.filter(e => e.id !== id)); }
  function updateDate(id, val) { setEntries(prev => prev.map(e => e.id === id ? { ...e, date: val } : e)); }

  async function runAnalysis(e) {
    e.preventDefault();
    if (!entries.length) return setErr("Add at least one file first.");
    const pdfs = entries.filter(e => e.type === "pdf");
    const csvs = entries.filter(e => e.type === "csv");
    const missingDate = pdfs.find(e => !e.date);
    if (missingDate) return setErr(`Set a date for: ${missingDate.file.name}`);
    if (!csvs.length && pdfs.length < 2) return setErr("Need at least 2 PDFs with different dates, or use a CSV with multiple date periods.");
    setErr(""); setBusy(true);
    try {
      const rows = ["date,text"];
      for (const entry of pdfs) {
        const txt = await extractTextFromPDF(entry.file);
        if (!txt.trim()) throw new Error(`Could not read text from ${entry.file.name}`);
        const clean = txt.replace(/"/g, '""').replace(/\n/g, " ");
        rows.push(`${entry.date},"${clean}"`);
      }
      for (const entry of csvs) {
        const raw = await entry.file.text();
        raw.split("\n").slice(1).filter(Boolean).forEach(l => rows.push(l));
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const fd = new FormData();
      fd.append("file", blob, "upload.csv");
      const res = await detectDrift(fd, threshold, groupBy);
      nav("/dashboard", {
        state: {
          results:   res.data.results,
          src:       entries.map(e => e.file.name).join(", "),
          threshold: threshold,
          groupBy:   groupBy,
        },
      });
    } catch (ex) {
      setErr(ex.response?.data?.detail || ex.message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  const pdfCount = entries.filter(e => e.type === "pdf").length;
  const csvCount = entries.filter(e => e.type === "csv").length;
  const hint = thresholdHint(threshold);

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="input-page-header">
        <h1>News Topic Drift Analysis</h1>
        <p>Upload news articles as CSV or PDF. Compares topics across time periods and flags when things shift.</p>
      </div>

      <div className="input-grid">
        {/* file upload panel */}
        <div className="card">
          <p className="panel-label">Files</p>
          <div
            className={`dropzone${dragging ? " dragging" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}
          >
            <div className="dropzone-icon">📂</div>
            <p className="dropzone-title">{dragging ? "Drop it here" : "Click or drag files here"}</p>
            <p className="dropzone-sub">CSV or PDF — multiple files ok</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.pdf"
              multiple
              style={{ display: "none" }}
              onChange={e => pickFiles(Array.from(e.target.files))}
            />
          </div>

          {entries.length > 0 && (
            <div className="file-list">
              {entries.map(entry => (
                <div key={entry.id} className="file-row">
                  <span className={`file-type-badge ${entry.type}`}>{entry.type.toUpperCase()}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="file-name">{entry.file.name}</p>
                    {entry.type === "pdf" ? (
                      <input
                        type="date"
                        value={entry.date}
                        onChange={e => updateDate(entry.id, e.target.value)}
                        className="date-input"
                      />
                    ) : (
                      <p className="file-date-note">dates read from file</p>
                    )}
                  </div>
                  <button className="remove-btn" onClick={() => removeFile(entry.id)}>×</button>
                </div>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <p className="file-summary">
              {csvCount > 0 ? `${csvCount} CSV` : ""}
              {csvCount > 0 && pdfCount > 0 ? " + " : ""}
              {pdfCount > 0 ? `${pdfCount} PDF${pdfCount > 1 ? "s" : ""}` : ""} added
            </p>
          )}
          {pdfCount === 1 && csvCount === 0 && (
            <p className="warn-one-pdf">One PDF is not enough — add at least one more with a different date.</p>
          )}
        </div>

        {/* settings panel */}
        <div className="card">
          <p className="panel-label">Settings</p>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
            Drift threshold — lower means more sensitive to topic changes.
          </p>

          <div className="threshold-row">
            <span className="threshold-edge">0.1</span>
            <input
              type="range" min="0.1" max="0.9" step="0.05"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="threshold-slider"
            />
            <span className="threshold-edge">0.9</span>
          </div>
          <div className="threshold-display">
            <span className="threshold-value">{threshold}</span>
            <span style={{ fontSize: 12, color: hint.color }}>{hint.text}</span>
          </div>

          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Group articles by</p>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {["day", "week", "month"].map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                style={{
                  padding: "4px 12px", borderRadius: 5, border: "1px solid",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: groupBy === g ? "#dbeafe" : "#f8fafc",
                  borderColor: groupBy === g ? "#93c5fd" : "#e2e8f0",
                  color: groupBy === g ? "#1d4ed8" : "#64748b",
                  transition: "all 0.1s",
                }}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="how-box">
            <p className="how-box-title">How it works</p>
            <p>1. Text cleaned and converted to TF-IDF vectors</p>
            <p>2. Cosine similarity calculated between {groupBy}s</p>
            <p>3. Score below {threshold} = drift flagged</p>
          </div>

          {err && <div className="err-box">{err}</div>}
          {busy && <div className="progress-wrap"><div className="progress-bar" /></div>}

          <button onClick={runAnalysis} disabled={busy || !entries.length} className="run-btn">
            {busy ? "Running analysis..." : "Run analysis"}
          </button>
          {busy && <p className="run-btn-note">This may take a few seconds...</p>}
        </div>
      </div>

      <div className="hints-grid">
        <div className="hint-card">
          <p className="hint-card-title">CSV format</p>
          <p className="hint-card-body">
            Needs a <code>date</code> and <code>text</code> column.
            Rows in the same period get merged before analysis.
          </p>
        </div>
        <div className="hint-card">
          <p className="hint-card-title">PDF format</p>
          <p className="hint-card-body">
            Text extracted automatically in the browser.
            Assign a date to each PDF. Upload 2+ to get a comparison.
          </p>
        </div>
      </div>
    </div>
  );
}

function thresholdHint(t) {
  if (t <= 0.2) return { text: "very sensitive — flags small changes", color: "#ef4444" };
  if (t <= 0.4) return { text: "balanced — good default",              color: "#d97706" };
  if (t <= 0.6) return { text: "moderate — only obvious shifts",       color: "#0369a1" };
  return           { text: "low sensitivity — major shifts only",      color: "#16a34a" };
}
