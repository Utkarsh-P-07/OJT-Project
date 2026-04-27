import { useEffect, useState } from 'react';
import axios from 'axios';
import './History.css';

const History = ({ getAuthHeaders }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/history`, { headers: getAuthHeaders() })
      .then(res => setRecords(res.data))
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Analysis History</h2>
        <p>All past drift analyses, newest first.</p>
      </div>

      {loading && <div className="history-state">Loading...</div>}
      {error   && <div className="history-state error">{error}</div>}
      {!loading && !error && !records.length && (
        <div className="history-state">No analysis history yet.</div>
      )}

      <div className="history-list">
        {records.map((r, i) => (
          <div key={i} className={`history-row ${r.drift_status}`}>
            <div className="history-row-left">
              <span className="history-filename">{r.filename}</span>
              <span className="history-time">{new Date(r.timestamp).toLocaleString()}</span>
            </div>
            <div className="history-row-right">
              <span className="history-score">{r.similarity_score?.toFixed(4)}</span>
              <span className={`history-badge ${r.drift_status}`}>
                {r.drift_status === 'no_drift' && '✅ No Drift'}
                {r.drift_status === 'slight_drift' && '⚠️ Slight Drift'}
                {r.drift_status === 'drift' && '🚨 Drift'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
