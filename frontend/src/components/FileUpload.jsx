const FileUpload = ({ file, setFile, onSubmit, loading, error }) => {
  const handleChange = (e) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
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
