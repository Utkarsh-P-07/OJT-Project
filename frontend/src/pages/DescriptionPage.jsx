import { useState } from "react";
import { useNavigate } from "react-router-dom";

const pipeline = [
  { n: "01", title: "Load the data",        body: "Articles come in as a CSV (date + text columns) or as PDF files. PDFs get their text pulled out automatically in the browser." },
  { n: "02", title: "Clean the text",       body: "Lowercase, strip URLs and punctuation, remove extra whitespace. Nothing fancy, just getting everything into a consistent shape before vectorizing." },
  { n: "03", title: "TF-IDF vectorization", body: "Each time period's text gets turned into a vector of numbers. Words that appear a lot in one period but rarely elsewhere get higher scores." },
  { n: "04", title: "Cosine similarity",    body: "We compare vectors from consecutive periods. Result is a score between 0 and 1, higher means the topics are more similar." },
  { n: "05", title: "Flag the drifts",      body: "If the similarity score drops below the threshold (default 0.3), that transition gets flagged as a topic drift." },
  { n: "06", title: "Show the results",     body: "Everything gets stored in MongoDB and shown on the dashboard — a similarity chart, per-period scores, and a breakdown table." },
];

const faqs = [
  { q: "What exactly is topic drift?",         a: "It's when the main subject of news coverage changes significantly over time. Like if articles in January are mostly about the economy, but by March they're mostly about climate policy, that's a drift." },
  { q: "What does the similarity score mean?", a: "It's a number from 0 to 1. Close to 1 means the two periods are talking about very similar things. Close to 0 means they're basically unrelated. We flag anything below 0.3 as a drift by default." },
  { q: "Why do I need at least 2 time periods?", a: "Because drift is about change. You can't detect a change with just one data point. Upload a CSV with articles from multiple dates, or upload 2+ PDFs each assigned to a different date." },
  { q: "How do I pick the right threshold?",   a: "0.3 works reasonably well for general news. If you're getting too many false positives, raise it. If you're missing obvious shifts, lower it." },
  { q: "Why TF-IDF and not something like BERT?", a: "TF-IDF is fast, interpretable, and works well for bulk comparison. BERT gives better semantic understanding but it's much heavier to run and harder to explain." },
  { q: "What does 'group by week/month' do?",  a: "Instead of comparing day-by-day, it merges all articles from the same week or month into one document before vectorizing. Useful when you have sparse daily data or want a broader view of topic shifts." },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const nav = useNavigate();

  return (
    <div style={{ maxWidth: 840 }}>
      <div className="desc-header">
        <h1>How it works</h1>
        <p>This tool uses NLP to track how news topics change over time.</p>
        <button onClick={() => nav("/")} className="small-btn" style={{ marginTop: 12 }}>Try it yourself</button>
      </div>

      <div className="card">
        <h2 className="section-h">What is topic drift?</h2>
        <p className="para">News coverage does not stay on one topic forever. A story about inflation can slowly turn into a story about government policy, then into a story about elections. These shifts happen gradually and it is hard to notice manually when dealing with hundreds of articles.</p>
        <p className="para">Topic drift detection automates this. It looks at the language used across different time periods and measures how similar they are. When similarity drops below a certain point, it flags that as a drift.</p>
        <div className="drift-example">
          <div className="drift-box" style={{ background: "#dbeafe", border: "1px solid #bfdbfe" }}>
            <p>Jan 2024</p>
            <p>economy, GDP, budget, inflation</p>
          </div>
          <div className="drift-arrow">
            <p>similarity</p>
            <p className="score" style={{ color: "#dc2626" }}>0.18</p>
            <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 11 }}>drift</p>
          </div>
          <div className="drift-box" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <p>Mar 2024</p>
            <p>climate, emissions, energy, environment</p>
          </div>
        </div>
      </div>

      <h2 className="section-h" style={{ marginBottom: 12 }}>The pipeline</h2>
      <div className="pipeline-grid">
        {pipeline.map(step => (
          <div key={step.n} className="pipeline-card">
            <p className="pipeline-num">{step.n}</p>
            <p className="pipeline-title">{step.title}</p>
            <p className="pipeline-body">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-h">TF-IDF in plain English</h2>
        <p className="para">TF-IDF turns text into numbers. A word that appears a lot in one document but rarely in others is probably important to that document. Common words get low scores, specific words that dominate a period get high scores.</p>
        <div className="tfidf-grid">
          <div className="info-box">
            <p className="info-box-title">TF — Term Frequency</p>
            <p className="info-box-body">How often a word shows up in a single document. More occurrences means a higher score for that word in that doc.</p>
          </div>
          <div className="info-box">
            <p className="info-box-title">IDF — Inverse Document Frequency</p>
            <p className="info-box-body">Penalises words that appear in every document. Rare words get boosted, common words get suppressed.</p>
          </div>
        </div>
        <div className="formula-box">
          <p>TF-IDF(word, doc) = TF(word, doc) × IDF(word)</p>
          <p className="sub">cosine_similarity(A, B) = (A · B) / (|A| × |B|)</p>
        </div>
      </div>

      <h2 className="section-h" style={{ marginBottom: 12 }}>Common questions</h2>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className={`faq-item${openFaq === i ? " open" : ""}`}>
            <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <span className="faq-q">{faq.q}</span>
              <span className="faq-toggle">{openFaq === i ? "−" : "+"}</span>
            </button>
            {openFaq === i && <p className="faq-answer">{faq.a}</p>}
          </div>
        ))}
      </div>

      <div className="cta-box">
        <p>Want to try it on your own data?</p>
        <p>Upload a CSV or a few PDFs and see what the analysis looks like.</p>
        <button onClick={() => nav("/")} className="small-btn">Go to Analyze</button>
      </div>
    </div>
  );
}
