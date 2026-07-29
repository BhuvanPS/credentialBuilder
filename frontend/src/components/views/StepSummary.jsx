import CredentialCard, { AISynthesisLoader } from '../CredentialCard';

/**
 * StepSummary — Step 3 of the credential builder.
 * Shows the AI synthesis loader while generating, then the final credential card
 * with Save and Go to Repository actions once ready.
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
  return (
    <div className="step-card">
      <h2>Step 3: Credential Summary</h2>
      <div className="step-content">
        {loading ? (
          <AISynthesisLoader />
        ) : summaryReady ? (
          <div>
            <CredentialCard summary={summary} pictureUrl={profilePictureUrl} />

            <div
              className="save-action-bar"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '32px',
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
                className="secondary"
                type="button"
                onClick={onGoToRepository}
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
              className="primary"
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
