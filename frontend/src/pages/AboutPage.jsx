// About page - project info, who built it, tech used

export default function AboutPage() {
  return (
    <div className="about-wrap">
      <div className="about-header">
        <h1>About</h1>
        <p>OJT project built as part of the MSU 2024-28 batch curriculum.</p>
      </div>

      <div className="about-card">
        <p className="panel-label">Project</p>
        <table className="about-table">
          <tbody>
            {[
              ["Title",            "News Topic Drift Detection"],
              ["Track",            "Application Development / Data Scientist"],
              ["Institution",      "Maharaja Sayajirao University (MSU)"],
              ["Batch",            "2024 - 2028"],
              ["Registration No.", "240410700130"],
            ].map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="about-card">
        <p className="panel-label">Developer</p>
        <div className="dev-row">
          <div
            className="avatar"
            style={{ width: 40, height: 40, background: "#dbeafe", border: "1px solid #bfdbfe", fontSize: 15, color: "#1d4ed8" }}
          >
            U
          </div>
          <div>
            <p className="dev-name">Utkarsh Pandey</p>
            <p className="dev-meta">Reg: 240410700130 &middot; Batch 2024-28</p>
          </div>
        </div>
      </div>

      <div className="about-card">
        <p className="panel-label">Mentors</p>
        <div className="mentor-list">
          {[
            { name: "Kshitiz Dhooria",   role: "Project Mentor" },
            { name: "Chennaveer Jogur",  role: "Project Mentor" },
          ].map(({ name, role }) => (
            <div key={name} className="mentor-row">
              <div
                className="avatar"
                style={{ width: 34, height: 34, background: "#ede9fe", border: "1px solid #ddd6fe", fontSize: 13, color: "#7c3aed" }}
              >
                {name.charAt(0)}
              </div>
              <div>
                <p className="mentor-name">{name}</p>
                <p className="mentor-role">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="about-card">
        <p className="panel-label">Tech stack</p>
        <div className="stack-grid">
          {[
            ["Python 3.11",  "core language"],
            ["FastAPI",      "REST API backend"],
            ["scikit-learn", "TF-IDF + cosine similarity"],
            ["React 18",     "frontend UI"],
            ["MongoDB",      "storing drift results"],
            ["pdfjs-dist",   "PDF text extraction in browser"],
            ["Recharts",     "charts on the dashboard"],
            ["Docker",       "containerisation"],
          ].map(([tech, desc]) => (
            <div key={tech} className="stack-row">
              <span className="stack-tech">{tech}</span>
              <span className="stack-desc">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="about-card" style={{ marginBottom: 0 }}>
        <p className="panel-label">What this does</p>
        <p className="about-desc">
          News topics shift over time and it is hard to track manually. This tool takes a dataset of news articles grouped by date and automatically detects when the main topics change significantly. It uses TF-IDF to represent each time period as a vector, then computes cosine similarity between consecutive periods. A drop below the configured threshold gets flagged as a drift event.
        </p>
        <p className="about-desc">
          Results are stored in MongoDB and visualised on a dashboard with a similarity chart and a breakdown table. Files can be uploaded as CSV (with date and text columns) or as PDFs.
        </p>
      </div>
    </div>
  );
}
