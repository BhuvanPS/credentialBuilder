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

export default function CredentialCard({ summary, pictureUrl }) {
  if (!summary) {
    return <p className="hint">No analyzed credential data available yet.</p>;
  }

  return (
    <div className="credential-card">
      <div className="card-header-profile" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        <img 
          src={pictureUrl || logo} 
          alt="Professional Profile" 
          className="card-avatar" 
          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--color-border)', flexShrink: 0 }} 
        />
        <div className="card-header-info">
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-dark)' }}>{summary.name}</h3>
          <p className="card-title" style={{ margin: '4px 0 0 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-primary)' }}>{summary.title}</p>
        </div>
      </div>
      <div className="card-section">
        <p className="card-label">Profile Summary</p>
        <p>{summary.summary || '--'}</p>
      </div>
    </div>
  );
}
