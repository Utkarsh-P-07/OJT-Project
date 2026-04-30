import { useEffect, useState } from 'react';
import axios from 'axios';
import './History.css';

const descriptions = {
  no_drift: {
    short: 'No Drift',
    icon: '✅',
    lines: [
      'The uploaded document is closely aligned with the reference news corpus. The content, topics, and vocabulary are consistent with what the model was trained on.',
      'A score above 0.50 indicates high similarity — no significant topic shift was detected.',
    ],
  },
  slight_drift: {
    short: 'Slight Drift',
    icon: '⚠️',
    lines: [
      'The document shows some deviation from the reference corpus. While parts of the content are recognizable, certain topics or vocabulary differ noticeably.',
      'A score between 0.15 and 0.50 suggests partial overlap — the content may cover related but diverging topics.',
    ],
  },
  drift: {
    short: 'Drift Detected',
    icon: '🚨',
    lines: [
      'The document is significantly different from the reference corpus. The topics, language, or style appear unrelated to the training data.',
      'A score below 0.15 indicates very low similarity — this content likely represents a completely different domain or subject area.',
    ],
  },
};

const History = ({ getAuthHeaders }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/history`, { headers: getAuthHeaders() })
      .then(res => setRecords(res.data))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (i) => setExpanded(prev => prev === i ? null : i);

  return (
    <div>
      <div className="page-header">
        <h2>Analysis History</h2>
        <p>All past drift analyses, newest first. Click a row to see details.</p>
      </div>

      {loading && <div className="history-state">Loading...</div>}
      {error   && <div className="history-state error">{error}</div>}
      {!loading && !error && !records.length && (
        <div className="history-state">No analysis history yet.</div>
      )}

      <div className="history-list">
        {records.map((r, i) => {
          const desc = descriptions[r.drift_status];
          const isOpen = expanded === i;
          const score = r.similarity_score ?? 0;

          return (
            <div key={i} className={`history-row ${r.drift_status} ${isOpen ? 'open' : ''}`}>
              {/* Clickable summary row */}
              <div className="history-row-summary" onClick={() => toggle(i)}>
                <div className="history-row-left">
                  <span className="history-filename">{r.filename}</span>
                  <span className="history-time">{new Date(r.timestamp).toLocaleString()}</span>
                </div>
                <div className="history-row-right">
                  <span className="history-score">{score.toFixed(4)}</span>
                  <span className={`history-badge ${r.drift_status}`}>
                    {desc.icon} {desc.short}
                  </span>
                  <span className={`history-chevron ${isOpen ? 'up' : ''}`}>▾</span>
                </div>
              </div>

              {/* Expandable detail */}
              {isOpen && (
                <div className={`history-detail ${r.drift_status}`}>
                  <div className="history-detail-desc">
                    {desc.lines.map((line, j) => <p key={j}>{line}</p>)}
                  </div>
                  <div className="history-bar-wrap">
                    <div className="history-bar-track">
                      <div
                        className={`history-bar-fill ${r.drift_status}`}
                        style={{ width: `${Math.min(score * 100, 100)}%` }}
                      />
                    </div>
                    <div className="history-bar-labels">
                      <span>0.0 — Drift</span>
                      <span>0.15</span>
                      <span>0.50</span>
                      <span>1.0 — No Drift</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
