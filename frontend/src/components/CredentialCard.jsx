import { useState, useEffect } from 'react';

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

export default function CredentialCard({ summary }) {
  if (!summary) {
    return <p className="hint">No analyzed credential data available yet.</p>;
  }

  return (
    <div className="credential-card">
      <h3>{summary.name}</h3>
      <p className="card-title">{summary.title}</p>
      <div className="card-section">
        <p className="card-label">Profile Summary</p>
        <p>{summary.summary || '--'}</p>
      </div>
    </div>
  );
}
