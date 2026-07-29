import logo from '../../logo.png';

/**
 * RepositoryView — displays all saved candidate profiles in a table.
 * Supports view, edit, and delete actions per row.
 */
export default function RepositoryView({
  candidatesLoading,
  candidatesList,
  onBackToMenu,
  onStartNew,
  onViewDetails,
  onLoadCandidate,
  onDeleteCandidate,
}) {
  return (
    <div className="page-card">
      {/* Back nav */}
      <div className="builder-header-nav">
        <button type="button" className="secondary btn-back-menu" onClick={onBackToMenu}>
          ← Back to Main Menu
        </button>
        <span className="active-mode-label">Active Mode: Credential Repository</span>
      </div>

      <div className="page-header-title">
        <h1>Credential Repository</h1>
        <p className="page-copy">View, manage, edit, and delete candidate summaries stored in the SQL database.</p>
      </div>

      {candidatesLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="ai-spinner-ring" style={{ margin: '0 auto 16px auto' }} />
          <p>Loading candidate records...</p>
        </div>
      ) : candidatesList.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            border: '2px dashed var(--color-border)',
            borderRadius: '12px',
          }}
        >
          <p style={{ margin: '0 0 16px 0', color: 'var(--color-dark-muted)' }}>
            No candidate credentials found in the database.
          </p>
          <button type="button" className="primary" onClick={onStartNew}>
            Create New Profile
          </button>
        </div>
      ) : (
        <div className="candidates-table-wrapper">
          <table className="candidates-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Current Title</th>
                <th>Date Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidatesList.map((candidate) => (
                <tr key={candidate.name}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={candidate.profile_picture_url || logo}
                        alt={candidate.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--color-border)',
                        }}
                      />
                      <span>{candidate.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-dark-muted)' }}>{candidate.title || '--'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-dark-muted)' }}>
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-row-actions">
                      <button className="secondary btn-row-action" onClick={() => onViewDetails(candidate.name)}>
                        View Summary
                      </button>
                      <button className="secondary btn-row-action" onClick={() => onLoadCandidate(candidate.name)}>
                        Edit Form
                      </button>
                      <button
                        className="secondary btn-row-action btn-row-delete"
                        onClick={() => onDeleteCandidate(candidate.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
