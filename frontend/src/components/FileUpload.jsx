import { useState } from 'react';

const FileUpload = ({ file, setFile, onSubmit, onTextSubmit, loading, error }) => {
  const [tab, setTab] = useState('file'); // 'file' | 'text'
  const [text, setText] = useState('');

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const name = selected.name.toLowerCase();
    if (!name.endsWith('.txt')) {
      alert('Only .txt files are supported. Please upload a plain text file.');
      e.target.value = '';
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      alert('File exceeds the 20MB size limit.');
      return;
    }
    setFile(selected);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    onTextSubmit(text);
  };

  return (
    <div className="upload-card">
      <div className="upload-tabs">
        <button
          className={`upload-tab ${tab === 'file' ? 'active' : ''}`}
          onClick={() => setTab('file')}
          type="button"
        >
          📁 Upload File
        </button>
        <button
          className={`upload-tab ${tab === 'text' ? 'active' : ''}`}
          onClick={() => setTab('text')}
          type="button"
        >
          ✏️ Type Text
        </button>
      </div>

      {tab === 'file' ? (
        <form onSubmit={onSubmit}>
          <div className={`drop-zone ${file ? 'has-file' : ''}`}>
            <input type="file" accept=".txt" onChange={handleChange} disabled={loading} />
            <div className="drop-zone-icon">{file ? '📄' : '☁️'}</div>
            <div className="drop-zone-label">
              {file ? 'File selected' : 'Click or drag a file here'}
            </div>
            {file
              ? <div className="drop-zone-file">{file.name}</div>
              : <div className="drop-zone-hint">.txt only</div>
            }
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="analyze-btn" disabled={loading || !file}>
            {loading ? <><span className="loader" /> Analyzing...</> : '🔍 Analyze'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleTextSubmit}>
          <textarea
            className="text-input"
            placeholder="Paste or type your news article here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            rows={8}
          />
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="analyze-btn" disabled={loading || !text.trim()}>
            {loading ? <><span className="loader" /> Analyzing...</> : '🔍 Analyze'}
          </button>
        </form>
      )}
    </div>
  );
};

export default FileUpload;
