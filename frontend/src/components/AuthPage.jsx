import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload);
      login({ name: data.name, email: data.email }, data.token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left branding */}
      <div className="auth-brand">
        <div className="auth-brand-icon">📰</div>
        <h1>News Drift Detector</h1>
        <p>Detect when news content drifts away from expected topics using ML-powered analysis.</p>
        <div className="auth-brand-features">
          <div className="auth-feature">📄 Supports TXT, PDF & Images</div>
          <div className="auth-feature">🤖 TF-IDF + Cosine Similarity</div>
          <div className="auth-feature">📊 Full analysis history</div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Sign in to continue' : 'Get started for free'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label>Name</label>
                <input name="name" type="text" placeholder="Your name" value={form.name} onChange={handleChange} required />
              </div>
            )}
            <div className="auth-field">
              <label>Email</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.4rem' }}>
              {loading ? <><span className="loader" /> Processing...</> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-toggle">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
