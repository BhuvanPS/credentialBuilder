/**
 * Header component rendered at the top of the application shell.
 * Provides a clean, modern logo branding and header layout.
 */
export default function Header() {
  return (
    <header className="app-header">
      <div className="app-logo-container">
        <div className="app-logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
            <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
            <path d="M2 17L12 22L22 17"/>
            <path d="M2 12L12 17L22 12"/>
          </svg>
        </div>
        <span className="app-logo-text">CredentialBuilder</span>
      </div>
    </header>
  );
}
