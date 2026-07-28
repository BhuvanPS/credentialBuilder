/**
 * Header component rendered at the top of the application shell.
 * Displays the Horizon Nexus Partners (HNP) branding, logo, and slogan
 * according to the 2026 visual identity guidelines.
 */
import logo from '../logo.png';

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-logo-container">
        <div className="hnp-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="HNP Logo" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
          <div className="hnp-logo-text-group">
            <span className="hnp-logo-text-line">Horizon</span>
            <span className="hnp-logo-text-line">Nexus</span>
            <span className="hnp-logo-text-line">Partners</span>
          </div>
        </div>
      </div>
      <div className="hnp-slogan-container">
        <span className="hnp-slogan-text">Modern. Different.</span>
        <span className="hnp-slogan-divider">|</span>
        <span className="hnp-app-title">Credential Builder</span>
      </div>
    </header>
  );
}
