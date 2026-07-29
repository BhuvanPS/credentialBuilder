/**
 * Displays a dismissible error banner when an error string is present.
 *
 * @param {string} error - Error message text. Renders nothing when falsy.
 */
export default function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div
      className="error-banner"
      style={{
        margin: '20px auto 0 auto',
        maxWidth: '1200px',
        width: '100%',
        padding: '16px',
        background: 'var(--color-error-light)',
        color: 'var(--color-error)',
        border: '1px solid rgba(240, 113, 103, 0.2)',
        borderRadius: '8px',
        boxSizing: 'border-box',
      }}
    >
      {error}
    </div>
  );
}
