import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { detectDrift } from "../services/api";
import { extractTextFromPDF } from "../utils/pdfParser";

export default function InputPage() {
  const [entries, setEntries] = useState([]);
  const [threshold, setThreshold] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const nav = useNavigate();

  function pickFiles(fileList) {
    const added = [];
    for (const f of fileList) {
      const ext = f.name.split(".").pop().toLowerCase();
      if (ext !== "csv" && ext !== "pdf") continue;
      added.push({ id: Math.random().toString(36).slice(2), file: f, type: ext, date: "" });
    }
    if (!added.length) { setErr("Only CSV or PDF files please."); return; }
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
    const noDates = pdfs.find(e => !e.date);
    if (noDates) return setErr("Set a date for: " + noDates.file.name);
    if (!csvs.length && pdfs.length < 2) return setErr("Need at least 2 PDFs with different dates. Or use a CSV with multiple date periods.");
    setErr(""); setBusy(true);
    try {
      const rows = ["date,text"];
      for (const entry of pdfs) {
        const txt = await extractTextFromPDF(entry.file);
        if (!txt.trim()) throw new Error("Could not read text from " + entry.file.name);
        const clean = txt.replace(/"/g, "\"\"").replace(/\n/g, " ");
        rows.push(entry.date + ",\"" + clean + "\"");
      }
      for (const entry of csvs) {
        const raw = await entry.file.text();
        raw.split("\n").slice(1).filter(Boolean).forEach(l => rows.push(l));
      }
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const fd = new FormData();
      fd.append("file", blob, "upload.csv");
      const res = await detectDrift(fd, threshold);
      nav("/dashboard", { state: { results: res.data.results, src: entries.map(e => e.file.name).join(", ") } });
    } catch (ex) {
      setErr(ex.response?.data?.detail || ex.message || "Something went wrong.");
    } finally { setBusy(false); }
  }

  const pdfCount = entries.filter(e => e.type === "pdf").length;
  const csvCount = entries.filter(e => e.type === "csv").length;

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>News Topic Drift Analysis</h1>
        <p style={{ color: "#6b8aaa", fontSize: 14 }}>Upload news articles as CSV or PDF. Compares topics across time periods and flags when things shift.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={box}>
          <p style={sLabel}>Files</p>
          <div style={{ ...dz, ...(dragging ? { borderColor: "#4f8ef7", background: "#0d1e30" } : {}) }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}>
            <p style={{ fontSize: 13, color: "#4f8ef7", marginBottom: 3 }}>{dragging ? "Drop it" : "Click or drag files here"}</p>
            <p style={{ fontSize: 12, color: "#3d5a7a" }}>CSV or PDF, multiple files ok</p>
            <input ref={inputRef} type="file" accept=".csv,.pdf" multiple style={{ display: "none" }} onChange={e => pickFiles(Array.from(e.target.files))} />
          </div>
          {entries.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map(entry => (
                <div key={entry.id} style={fRow}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: entry.type === "pdf" ? "#0f2040" : "#0a2010", color: entry.type === "pdf" ? "#7eb8f7" : "#5aaa7a", padding: "2px 5px", borderRadius: 3, flexShrink: 0 }}>{entry.type.toUpperCase()}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.file.name}</p>
                    {entry.type === "pdf"
                      ? <input type="date" value={entry.date} onChange={e => updateDate(entry.id, e.target.value)} style={{ marginTop: 3, padding: "2px 6px", border: "1px solid #1e3550", borderRadius: 4, background: "#07111f", color: "#dde3ec", fontSize: 12, width: "100%" }} />
                      : <p style={{ fontSize: 11, color: "#3d5a7a", marginTop: 2 }}>dates read from file</p>}
                  </div>
                  <button onClick={() => removeFile(entry.id)} style={{ background: "none", border: "none", color: "#3d5a7a", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>x</button>
                </div>
              ))}
            </div>
          )}
          {entries.length > 0 && <p style={{ fontSize: 12, color: "#3d5a7a", marginTop: 10 }}>{csvCount > 0 ? csvCount + " CSV" : ""}{csvCount > 0 && pdfCount > 0 ? " + " : ""}{pdfCount > 0 ? pdfCount + " PDF" + (pdfCount > 1 ? "s" : "") : ""} added</p>}
          {pdfCount === 1 && csvCount === 0 && <p style={{ fontSize: 12, color: "#c97b2a", marginTop: 8, lineHeight: 1.5 }}>One PDF is not enough — add at least one more with a different date.</p>}
        </div>
        <div style={box}>
          <p style={sLabel}>Settings</p>
          <p style={{ fontSize: 12, color: "#3d5a7a", marginBottom: 10 }}>Drift threshold — lower means more sensitive to topic changes.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#3d5a7a" }}>0.1</span>
            <input type="range" min="0.1" max="0.9" step="0.05" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} style={{ flex: 1, accentColor: "#4f8ef7" }} />
            <span style={{ fontSize: 12, color: "#3d5a7a" }}>0.9</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#4f8ef7" }}>{threshold}</span>
            <span style={{ fontSize: 12, color: tHint(threshold).color }}>{tHint(threshold).text}</span>
          </div>
          <div style={{ background: "#07111f", borderRadius: 6, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "#6b8aaa", lineHeight: 1.8, border: "1px solid #152033" }}>
            <p style={{ fontWeight: 600, color: "#7ec8e3", marginBottom: 4, fontSize: 12 }}>How it works</p>
            <p>1. Text cleaned and converted to TF-IDF vectors</p>
            <p>2. Cosine similarity calculated between periods</p>
            <p>3. Score below threshold = drift flagged</p>
          </div>
          {err && <div style={{ background: "#1a0e0e", border: "1px solid #5c2020", borderRadius: 6, padding: "9px 12px", color: "#e07070", fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <button onClick={runAnalysis} disabled={busy || !entries.length}
            style={{ width: "100%", padding: "10px 0", background: busy || !entries.length ? "#0d1929" : "#0f3060", color: busy || !entries.length ? "#3d5a7a" : "#a8c8f8", border: "1px solid #1e3a6e", borderRadius: 6, cursor: busy || !entries.length ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14 }}>
            {busy ? "Running..." : "Run analysis"}
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ ...box, padding: "12px 14px" }}>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 5 }}>CSV format</p>
          <p style={{ fontSize: 12, color: "#3d5a7a", lineHeight: 1.6 }}>Needs a date and text column. Rows with the same date get merged before analysis.</p>
        </div>
        <div style={{ ...box, padding: "12px 14px" }}>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 5 }}>PDF format</p>
          <p style={{ fontSize: 12, color: "#3d5a7a", lineHeight: 1.6 }}>Text extracted automatically. Assign a date to each PDF. Upload 2+ to get a comparison.</p>
        </div>
      </div>
    </div>
  );
}

function tHint(t) {
  if (t <= 0.2) return { text: "very sensitive", color: "#e07070" };
  if (t <= 0.4) return { text: "balanced", color: "#c97b2a" };
  if (t <= 0.6) return { text: "moderate", color: "#7ec8e3" };
  return { text: "low sensitivity", color: "#5a8a5a" };
}

const box = { background: "#0d1929", border: "1px solid #152a40", borderRadius: 8, padding: "16px 18px" };
const sLabel = { fontSize: 11, fontWeight: 600, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 };
const dz = { border: "1px dashed #1e3550", borderRadius: 6, padding: "20px 12px", textAlign: "center", cursor: "pointer" };
const fRow = { display: "flex", alignItems: "center", gap: 10, background: "#07111f", border: "1px solid #152a40", borderRadius: 6, padding: "7px 10px" };
