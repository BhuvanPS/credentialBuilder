/**
 * StepIngestion — Step 1 of the credential builder.
 * Renders the profile photo upload card, resume dropzone,
 * LinkedIn URL input, and the unified ingest-and-process action button.
 */
export default function StepIngestion({
  files,
  setFiles,
  setFileName,
  linkedinUrl,
  setLinkedinUrl,
  profilePictureUrl,
  setProfilePictureUrl,
  isDragging,
  loading,
  processingPhase,
  ingestionSource,
  onFileChange,
  onPictureChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onIngest,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>

      {/* ── PROFILE PHOTO CARD ─────────────────────────────── */}
      <div className="step-card photo-upload-card">
        <div className="photo-upload-card-text">
          <h3>Professional Profile Photo</h3>
          <p>Attach a professional portrait to display next to the candidate credentials on the summary card.</p>
        </div>

        <div className="photo-upload-selector-container">
          {!profilePictureUrl ? (
            <div
              className="photo-upload-selector"
              onClick={() => document.getElementById('photo-file-input').click()}
            >
              <input
                type="file"
                id="photo-file-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onPictureChange}
              />
              <div className="photo-selector-left">
                <svg className="photo-selector-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Upload Photo (Optional)</span>
              </div>
              <span className="btn-upload-photo">Browse</span>
            </div>
          ) : (
            <div className="attachment-bar" style={{ background: '#e0f2fe', borderColor: 'rgba(14, 165, 233, 0.2)', color: '#0369a1' }}>
              <div className="attachment-info">
                <img
                  src={profilePictureUrl}
                  alt="Attached avatar"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }}
                />
                <span>Photo attached successfully</span>
              </div>
              <button
                type="button"
                className="btn-remove-attachment"
                onClick={() => setProfilePictureUrl(null)}
                title="Remove photo"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN INGESTION GRID ──────────────────────── */}
      <div className="ingestion-grid">

        {/* CARD 1: LOCAL FILE UPLOAD */}
        <div className="ingestion-card">
          <div className="ingestion-card-header">
            <h3>Upload Local Resume</h3>
            <p>Choose a PDF or Word document from your computer or drag it directly into the zone below.</p>
          </div>

          <div className="ingestion-card-body">
            <div
              className={`dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('resume-file-input').click()}
            >
              <input
                type="file"
                id="resume-file-input"
                accept=".pdf,.docx"
                multiple
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
              <div className="dropzone-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="dropzone-title">Drag &amp; Drop files here</p>
              <p className="dropzone-subtitle">or click to browse from finder (PDF or DOCX up to 10MB)</p>
            </div>

            {files.length > 0 && (
              <div className="attachment-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '16px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-dark-muted)', textTransform: 'uppercase' }}>
                  Attached Files ({files.length})
                </p>
                {files.map((f, idx) => (
                  <div className="attachment-bar" key={idx}>
                    <div className="attachment-info">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="attachment-name" title={f.name}>{f.name}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-attachment"
                      onClick={() => {
                        const updated = files.filter((_, i) => i !== idx);
                        setFiles(updated);
                        setFileName(updated.length === 0 ? '' : (updated.length === 1 ? updated[0].name : `${updated.length} files attached`));
                      }}
                      title="Remove file"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: LINKEDIN IMPORT */}
        <div className="ingestion-card">
          <div className="ingestion-card-header">
            <h3>Import from LinkedIn</h3>
            <p>Import background timeline, achievements, and education directly from a public LinkedIn profile page.</p>
          </div>

          <div className="ingestion-card-body" style={{ justifyContent: 'center' }}>
            <label className="field-row">
              <span>Public LinkedIn URL</span>
              <div className="linkedin-input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* ── UNIFIED ACTION BUTTON ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <button
          className="primary"
          style={{ minWidth: '340px', padding: '14px 32px', fontSize: '1rem' }}
          onClick={onIngest}
          disabled={loading || (files.length === 0 && !linkedinUrl.trim())}
        >
          {loading ? (
            <span>
              {processingPhase === 'uploading'
                ? (ingestionSource === 'linkedin' ? 'Scraping LinkedIn...' : 'Uploading Files...')
                : 'Analyzing Documents...'}
            </span>
          ) : (
            <span>
              {files.length > 0 && linkedinUrl.trim()
                ? 'Merge & Process Resume + LinkedIn'
                : files.length > 0 ? 'Process Ingested Resume' : 'Import from LinkedIn'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
