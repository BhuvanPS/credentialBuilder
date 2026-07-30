/**
 * WelcomeView — landing screen styled after the horizonnp.com.au home hero.
 *
 * Left: Eyebrow, Heading (Modern. Different.), Subhead, and Pill Outline Buttons.
 * Right: Stylized large HNP graphic.
 */
export default function WelcomeView({ onBuild, onManage }) {
  return (
    <div className="hnp-hero-container">
      <div className="hnp-hero-left">
        <p className="hnp-hero-eyebrow">Horizon Nexus Partners</p>
        <h1 className="hnp-hero-title">
          Modern. <span className="hnp-hero-accent">Different.</span>
        </h1>
        <p className="hnp-hero-subtitle">
          We're a partner-led modern professional services firm. Customize and manage your candidate credential cards.
        </p>
        <div className="hnp-hero-actions">
          <button className="hnp-pill-btn" onClick={onBuild}>
            Build Credentials
          </button>
          <button className="hnp-pill-btn" onClick={onManage}>
            View Repository
          </button>
        </div>
      </div>
      <div className="hnp-hero-right">
        {/* Giant abstract HNP H-watermark graphic */}
        <div className="hnp-watermark-wrapper">
          <svg className="hnp-watermark-svg" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="40" height="200" rx="6" fill="currentColor" />
            <rect x="140" y="20" width="40" height="200" rx="6" fill="currentColor" />
            <rect x="60" y="100" width="80" height="40" rx="6" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
