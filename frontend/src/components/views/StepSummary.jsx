import { useState } from 'react';
import CredentialCard, { AISynthesisLoader } from '../CredentialCard';

/**
 * StepSummary — Step 3 of the credential builder.
 * Shows the AI synthesis loader while generating, then the final credential card
 * with Save and Go to Repository actions once ready.
 *
 * If the user tries to navigate to the repository without saving, an inline
 * warning banner is shown asking them to confirm before discarding.
 */
export default function StepSummary({
  loading,
  summaryReady,
  summary,
  profilePictureUrl,
  savingStatus,
  formData,
  onGenerateSummary,
  onSaveProfile,
  onGoToRepository,
}) {
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const handleRepositoryClick = () => {
    // If already saved, navigate immediately
    if (savingStatus === 'success') {
      onGoToRepository();
      return;
    }
    // Otherwise surface the inline warning
    setShowUnsavedWarning(true);
  };

  return (
    <div className="step-card">
      <h2>Step 3: Credential Summary</h2>
      <div className="step-content">
        {loading ? (
          <AISynthesisLoader />
        ) : summaryReady ? (
          <div>
            <CredentialCard summary={summary} pictureUrl={profilePictureUrl} />

            {/* ── Unsaved warning banner ───────────────────────────────── */}
            {showUnsavedWarning && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginTop: '24px',
                  padding: '14px 20px',
                  background: '#fff8f0',
                  border: '1px solid rgba(240, 113, 103, 0.35)',
                  borderLeft: '4px solid var(--color-peach, #f07167)',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f07167" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span style={{ fontSize: '0.88rem', color: 'rgba(8,28,54,0.82)', fontWeight: 500 }}>
                    This profile hasn't been saved yet. Leaving now will discard unsaved changes.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => setShowUnsavedWarning(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      background: 'var(--color-peach, #f07167)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={onGoToRepository}
                  >
                    Discard &amp; Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Action bar ───────────────────────────────────────────── */}
            <div
              className="save-action-bar"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '24px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '24px',
              }}
            >
              <button
                className="primary"
                type="button"
                onClick={onSaveProfile}
                disabled={savingStatus === 'saving'}
                style={{ minWidth: '220px', padding: '12px 24px', fontSize: '0.95rem' }}
              >
                {savingStatus === 'saving'
                  ? 'Saving...'
                  : savingStatus === 'success'
                  ? '✓ Saved Successfully'
                  : 'Save Candidate Profile'}
              </button>

              <button
                className="primary-gold"
                type="button"
                onClick={handleRepositoryClick}
                style={{ padding: '12px 24px' }}
              >
                Go to Repository
              </button>
            </div>
          </div>
        ) : (
          <div className="summary-placeholder">
            <p className="hint">
              Summary has not been generated yet. Click the button on Step 2 after analysis completes.
            </p>
            <button
              className="primary-gold"
              type="button"
              onClick={onGenerateSummary}
              disabled={loading || !formData?.fullName?.value}
            >
              Generate Credential Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

