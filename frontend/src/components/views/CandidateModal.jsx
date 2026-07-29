import CredentialCard from '../CredentialCard';

/**
 * CandidateModal — full-screen overlay showing a candidate's credential card.
 * Provides Close and Edit Profile actions.
 *
 * @param {object|null} candidate - Selected candidate detail object from the database.
 * @param {Function} onClose - Closes the modal.
 * @param {Function} onEdit - Loads the candidate into the builder for editing.
 */
export default function CandidateModal({ candidate, onClose, onEdit }) {
  if (!candidate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-modal-close" onClick={onClose}>
          &times;
        </button>

        <h2 style={{ color: 'var(--color-primary)', marginTop: 0, marginBottom: '24px' }}>
          Candidate Credential Profile
        </h2>

        <CredentialCard
          summary={candidate.summary_data}
          pictureUrl={candidate.profile_picture_url}
        />

        <div className="modal-footer-actions">
          <button className="secondary" onClick={onClose}>
            Close View
          </button>
          <button className="primary" onClick={() => onEdit(candidate.name)}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
