const FileUpload = ({ file, setFile, onSubmit, loading, error }) => {
  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 20 * 1024 * 1024) {
      alert('File exceeds the 20MB size limit.');
      return;
    }
    setFile(selected);
  };

  return (
    <form onSubmit={onSubmit} className="upload-card">
      <div className={`drop-zone ${file ? 'has-file' : ''}`}>
        <input type="file" accept=".txt,.pdf,.png,.jpg,.jpeg" onChange={handleChange} disabled={loading} />
        <div className="drop-zone-icon">{file ? '📄' : '☁️'}</div>
        <div className="drop-zone-label">
          {file ? 'File selected' : 'Click or drag a file here'}
        </div>
        {file
          ? <div className="drop-zone-file">{file.name}</div>
          : <div className="drop-zone-hint">.txt · .pdf · .png · .jpg</div>
        }
      </div>

      {error && <div className="error-msg">{error}</div>}

      <button type="submit" className="analyze-btn" disabled={loading || !file}>
        {loading ? <><span className="loader" /> Analyzing...</> : '🔍 Analyze'}
      </button>
    </form>
  );
};

export default FileUpload;
