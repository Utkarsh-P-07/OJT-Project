import React from 'react';

const FileUpload = ({ file, setFile, onSubmit, loading }) => {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={onSubmit} className="upload-card">
      <div className="file-input-group">
        <label>Upload News File (.txt, .pdf, .png, .jpg)</label>
        <input 
          type="file" 
          accept=".txt,.pdf,.png,.jpg,.jpeg" 
          onChange={handleFileChange} 
          disabled={loading}
        />
        {file && <p className="file-name">Selected: {file.name}</p>}
      </div>
      <button type="submit" disabled={loading || !file}>
        {loading ? (
          <><span className="loader"></span> Processing Target...</>
        ) : (
          "Analyze News"
        )}
      </button>
    </form>
  );
};

export default FileUpload;
