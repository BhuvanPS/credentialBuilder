import { useState, useEffect } from 'react';
import logo from '../logo.png';

export function AISynthesisLoader() {
  const [statusIdx, setStatusIdx] = useState(0);
  const statuses = [
    'Synthesizing professional background...',
    'Analyzing core competencies & expertise...',
    'Structuring executive summary layout...',
    'Formulating profile overview paragraph...',
    'Finalizing executive summary card...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % statuses.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ai-loader-container">
      <div className="ai-spinner-ring"></div>
      <div className="ai-loader-status">{statuses[statusIdx]}</div>
      <div className="ai-loader-substatus">Azure AI Agent Service is processing your inputs</div>
      <div className="ai-skeleton-card">
        <div className="ai-skeleton-line h3"></div>
        <div className="ai-skeleton-line title"></div>
        <div className="ai-skeleton-line para-1" style={{ marginTop: '16px' }}></div>
        <div className="ai-skeleton-line para-2"></div>
        <div className="ai-skeleton-line para-3"></div>
      </div>
    </div>
  );
}

/**
 * Premium single-slide credential card — minimal, presentation-ready.
 */
export default function CredentialCard({ summary, pictureUrl }) {
  if (!summary) {
    return <p className="hint">No analyzed credential data available yet.</p>;
  }

  // Cap list items to keep it to one slide
  const expertise    = (summary.keyExpertise || []).slice(0, 8);
  const competencies = (summary.coreCompetencies || []).slice(0, 6);
  // const certs       = (summary.certifications || []).slice(0, 4);
  // const education   = (summary.education || []).slice(0, 2);

  return (
    <div className="cc-card">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="cc-header">
        <div className="cc-header-left">
          <div className="cc-avatar-ring">
            <img
              src={pictureUrl || logo}
              alt={summary.name}
              className="cc-avatar"
            />
          </div>
          <div className="cc-header-identity">
            <h2 className="cc-name" style={{ color: '#EAEFF5' }}>{summary.name}</h2>
            <p className="cc-job-title">{summary.title}</p>
            {/* {summary.roleServiceLine && (
              <p className="cc-service-line">{summary.roleServiceLine}</p>
            )} */}
          </div>
        </div>

        <div className="cc-header-right">
          <img src={logo} alt="HNP" className="cc-header-logo" />
          <span className="cc-confidential-badge">Confidential</span>
        </div>
      </header>

      {/* ── ACCENT RULE ────────────────────────────────────── */}
      <div className="cc-accent-rule" />

      {/* ── BODY ───────────────────────────────────────────── */}
      <div className="cc-body">

        {/* LEFT COL — Summary + Expertise */}
        <div className="cc-col-left">

          {summary.summary && (
            <section className="cc-section">
              <p className="cc-section-label">Profile Summary</p>
              <p className="cc-summary">{summary.summary}</p>
            </section>
          )}

          {expertise.length > 0 && (
            <section className="cc-section">
              <p className="cc-section-label">Key Expertise</p>
              <div className="cc-chips">
                {expertise.map((item, i) => (
                  <span key={i} className="cc-chip">{item}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COL — Competencies, Certs, Education */}
        <div className="cc-col-right">

          {competencies.length > 0 && (
            <section className="cc-section">
              <p className="cc-section-label">Core Competencies</p>
              <ul className="cc-dot-list">
                {competencies.map((item, i) => (
                  <li key={i} className="cc-dot-item">
                    <span className="cc-dot" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        {/* {certs.length > 0 && (
                    <section className="cc-section">
                      <p className="cc-section-label">Certifications</p>
                      <ul className="cc-dot-list">
                        {certs.map((item, i) => (
                          <li key={i} className="cc-dot-item cc-dot-item--blue">
                            <span className="cc-dot cc-dot--blue" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {education.length > 0 && (
                    <section className="cc-section">
                      <p className="cc-section-label">Education</p>
                      <ul className="cc-dot-list">
                        {education.map((item, i) => (
                          <li key={i} className="cc-dot-item">
                            <span className="cc-dot" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )} */}
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="cc-footer">
        <span className="cc-footer-text">Horizon Nexus Partners · Prepared for Client Presentation · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
