import { useState } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    
    setError('');
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/analyze-news", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "An error occurred during analysis.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>News Drift Detector</h1>
      
      <FileUpload 
        file={file} 
        setFile={setFile} 
        onSubmit={handleSubmit} 
        loading={loading} 
      />

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className={`result-card ${result.drift ? 'drift' : 'no-drift'}`}>
          <div className="result-score">
            Average Similarity Score: <strong>{result.similarity_score}</strong>
          </div>
          <div className="result-status">
            {result.message} 
            {result.drift ? ' 🚨' : ' ✅'}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
