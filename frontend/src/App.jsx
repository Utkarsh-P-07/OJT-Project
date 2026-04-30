import { useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import FileUpload from './components/FileUpload';
import HowItWorks from './components/HowItWorks';
import History from './components/History';
import AuthPage from './components/AuthPage';
import ProfileBadge from './components/ProfileBadge';
import './styles/index.css';

function App() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('app');

  if (!user) return <AuthPage />;

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload.'); return; }
    setError(''); setResult(null); setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/analyze-news`, formData, {
        headers: { ...getAuthHeaders() }
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (text) => {
    if (!text.trim()) { setError('Please enter some text.'); return; }
    setError(''); setResult(null); setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/analyze-text`,
        { text },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { key: 'app',           label: '🔍 Detector' },
    { key: 'history',       label: '🕒 History'  },
    { key: 'how-it-works',  label: '📖 How It Works' },
  ];

  return (
    <div className="app-layout">
      {/* Top navbar */}
      <header className="navbar">
        <div className="navbar-brand" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
          📰 <span>News</span> Drift Detector
        </div>
        <nav className="navbar-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-link ${view === item.key ? 'active' : ''}`}
              onClick={() => setView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <ProfileBadge />
      </header>

      {/* Page content */}
      <main className="main-content">
        {view === 'how-it-works' && <HowItWorks />}
        {view === 'history'      && <History getAuthHeaders={getAuthHeaders} />}
        {view === 'app'          && (
          <>
            <div className="page-header">
              <h2>Analyze a Document</h2>
              <p>Upload a news file to check for content drift against the reference corpus.</p>
            </div>
            <div className="detector-layout">
              <FileUpload
                file={file}
                setFile={setFile}
                onSubmit={handleSubmit}
                onTextSubmit={handleTextSubmit}
                loading={loading}
                error={error}
              />
              <div className="result-panel">
                {!result ? (
                  <div className="result-empty">
                    <div className="result-empty-icon">📊</div>
                    <p>Your analysis results will appear here.</p>
                  </div>
                ) : (
                  <div className="result-card">
                    <div className={`result-badge ${result.status}`}>
                      {result.status === 'no_drift' && '✅ No Drift'}
                      {result.status === 'slight_drift' && '⚠️ Slight Drift'}
                      {result.status === 'drift' && '🚨 Drift Detected'}
                    </div>
                    <div className="result-score-big">{result.similarity_score}</div>
                    <div className="result-score-label">Average Similarity Score</div>
                    <div className={`result-status ${result.status}`}>
                      {result.message}
                    </div>
                    <div className={`result-description ${result.status}`}>
                      {result.status === 'no_drift' && (
                        <>
                          <p>The uploaded document is <strong>closely aligned</strong> with the reference news corpus. The content, topics, and vocabulary are consistent with what the model was trained on.</p>
                          <p>A score above <strong>0.50</strong> indicates high similarity — no significant topic shift was detected.</p>
                        </>
                      )}
                      {result.status === 'slight_drift' && (
                        <>
                          <p>The document shows <strong>some deviation</strong> from the reference corpus. While parts of the content are recognizable, certain topics or vocabulary differ noticeably.</p>
                          <p>A score between <strong>0.15 and 0.50</strong> suggests partial overlap — the content may cover related but diverging topics.</p>
                        </>
                      )}
                      {result.status === 'drift' && (
                        <>
                          <p>The document is <strong>significantly different</strong> from the reference corpus. The topics, language, or style appear unrelated to the training data.</p>
                          <p>A score below <strong>0.15</strong> indicates very low similarity — this content likely represents a completely different domain or subject area.</p>
                        </>
                      )}
                    </div>
                    <div className="result-score-bar-wrap">
                      <div className="result-score-bar-track">
                        <div
                          className={`result-score-bar-fill ${result.status}`}
                          style={{ width: `${Math.min(result.similarity_score * 100, 100)}%` }}
                        />
                      </div>
                      <div className="result-score-bar-labels">
                        <span>0.0 — Drift</span>
                        <span>0.15</span>
                        <span>0.50</span>
                        <span>1.0 — No Drift</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
