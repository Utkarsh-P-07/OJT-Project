import './HowItWorks.css';

const steps = [
  { icon: '☁️', title: 'Upload',     desc: 'Select a .txt or .pdf file containing news content.' },
  { icon: '🔤', title: 'Extract',    desc: 'Text is extracted from your file — PDF text layer is parsed directly.' },
  { icon: '🧹', title: 'Clean',      desc: 'Text is lowercased, tokenized, stop-words removed, and lemmatized.' },
  { icon: '📐', title: 'Vectorize',  desc: 'Cleaned text is transformed into TF-IDF vectors.' },
  { icon: '📏', title: 'Compare',    desc: 'Cosine similarity is computed against the reference corpus.' },
  { icon: '📊', title: 'Result',     desc: 'Score ≥ 0.5 = No Drift, 0.15–0.49 = Slight Drift, < 0.15 = Drift Detected.' },
];

const formats = [
  { icon: '📄', label: '.txt', desc: 'Plain text files' },
  { icon: '📕', label: '.pdf', desc: 'PDF documents (text layer required)' },
];

const HowItWorks = () => (
  <div className="hiw-wrapper">
    <div className="page-header">
      <h2>How It Works</h2>
      <p>A quick overview of the drift detection pipeline.</p>
    </div>

    <div className="hiw-steps">
      {steps.map((s, i) => (
        <div className="hiw-step" key={i}>
          <div className="hiw-step-icon">{s.icon}</div>
          <div className="hiw-step-num">Step {i + 1}</div>
          <div className="hiw-step-title">{s.title}</div>
          <div className="hiw-step-desc">{s.desc}</div>
        </div>
      ))}
    </div>

    <div className="hiw-section-title">Supported Formats</div>
    <div className="hiw-formats">
      {formats.map((f, i) => (
        <div className="hiw-format" key={i}>
          <span className="hiw-format-icon">{f.icon}</span>
          <span className="hiw-format-label">{f.label}</span>
          <span className="hiw-format-desc">{f.desc}</span>
        </div>
      ))}
    </div>

    <div className="hiw-section-title" style={{ marginTop: '2rem' }}>Understanding Your Score</div>
    <div className="hiw-score-guide">
      <div className="hiw-score-row">
        <div className="hiw-score-range high">0.50 – 1.0</div>
        <div className="hiw-score-detail">
          <span className="hiw-score-label no-drift">✅ No Drift</span>
          <span className="hiw-score-desc">Your document closely matches the reference corpus in topic and vocabulary.</span>
        </div>
      </div>
      <div className="hiw-score-row">
        <div className="hiw-score-range mid">0.15 – 0.49</div>
        <div className="hiw-score-detail">
          <span className="hiw-score-label slight-drift">⚠️ Slight Drift</span>
          <span className="hiw-score-desc">Some overlap exists but the content is partially diverging from the reference material.</span>
        </div>
      </div>
      <div className="hiw-score-row">
        <div className="hiw-score-range low">0.0 – 0.14</div>
        <div className="hiw-score-detail">
          <span className="hiw-score-label drift">🚨 Drift Detected</span>
          <span className="hiw-score-desc">The document diverges significantly — the topic, vocabulary, or focus has shifted away from what's expected.</span>
        </div>
      </div>
      <div className="hiw-score-note">
        The score is the <strong>average maximum cosine similarity</strong> between your document's sentences and the reference corpus. A score of <strong>1.0</strong> means a perfect match; <strong>0.0</strong> means no overlap at all.
      </div>
    </div>
  </div>
);

export default HowItWorks;
