/**
 * WelcomeView — landing screen shown when no mode is active.
 * Presents two options: Build Credentials or View & Manage Credentials.
 *
 * @param {Function} onBuild - Called when the user selects Build mode.
 * @param {Function} onManage - Called when the user selects Manage mode.
 */
export default function WelcomeView({ onBuild, onManage }) {
  return (
    <div className="page-card welcome-container">
      <div className="welcome-header">
        <h1>Horizon Nexus Partners</h1>
        <p>Credential Builder &amp; Repository System</p>
      </div>

      <div className="welcome-grid">
        <div className="welcome-card card-build" onClick={onBuild}>
          <div className="welcome-card-icon">📝</div>
          <h3>Build Credentials</h3>
          <p>Ingest resumes, extract fields, edit capabilities, and synthesize AI-based candidate summaries.</p>
        </div>

        <div className="welcome-card card-manage" onClick={onManage}>
          <div className="welcome-card-icon">🗄️</div>
          <h3>View &amp; Manage Credentials</h3>
          <p>Access the repository of all previously generated candidate summaries, view cards, edit records, or delete profiles.</p>
        </div>
      </div>
    </div>
  );
}
