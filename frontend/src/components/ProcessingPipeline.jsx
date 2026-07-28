/**
 * ProcessingPipeline component renders an animated stepped timeline
 * showing the progress of document upload, Azure storage copy, and 
 * Azure Content Understanding schema analysis in real-time.
 *
 * @param {object} props
 * @param {string} props.phase - Current active phase ('idle' | 'uploading' | 'saving_azure' | 'analyzing' | 'completed')
 * @param {string} props.fileName - Filename of the target document
 * @param {string} props.azureUrl - Generated SAS URL for the blob
 */
export default function ProcessingPipeline({ phase, fileName, azureUrl }) {
  if (phase === 'idle') return null;

  const getProgressWidth = (phase) => {
    switch (phase) {
      case 'uploading': return '25%';
      case 'saving_azure': return '60%';
      case 'analyzing': return '85%';
      case 'completed': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="pipeline-container">
      <div className="pipeline-header-row" style={{ marginBottom: '8px' }}>
        <div className="pipeline-title">Document Processing Pipeline</div>
      </div>
      
      {/* Animated linear progress bar */}
      <div className="pipeline-progress-bar-container" style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
        <div className="pipeline-progress-bar" style={{ width: getProgressWidth(phase), height: '100%', background: 'linear-gradient(90deg, var(--color-prussian) 0%, var(--color-digital) 100%)', borderRadius: '2px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
      </div>

      <div className="pipeline-steps">
        {/* Step 1: Uploading */}
        <div className={`pipeline-step ${phase === 'uploading' ? 'active' : ''} ${['saving_azure', 'analyzing', 'completed'].includes(phase) ? 'completed' : ''}`}>
          <div className="pipeline-icon">
            {phase === 'uploading' ? (
              <div className="pipeline-spinner"></div>
            ) : ['saving_azure', 'analyzing', 'completed'].includes(phase) ? (
              <span className="pipeline-check">&#x2713;</span>
            ) : (
              <div className="pipeline-dot"></div>
            )}
          </div>
          <span>
            {phase === 'uploading' ? 'Uploading document to server...' : 'Document uploaded successfully'}
          </span>
        </div>
        {fileName && ['uploading', 'saving_azure', 'analyzing', 'completed'].includes(phase) && (
          <div className="pipeline-meta">
            File: <code>{fileName}</code>
          </div>
        )}

        {/* Step 2: Azure Storage */}
        <div className={`pipeline-step ${phase === 'saving_azure' ? 'active' : ''} ${['analyzing', 'completed'].includes(phase) ? 'completed' : ''}`}>
          <div className="pipeline-icon">
            {phase === 'saving_azure' ? (
              <div className="pipeline-spinner"></div>
            ) : ['analyzing', 'completed'].includes(phase) ? (
              <span className="pipeline-check">&#x2713;</span>
            ) : (
              <div className="pipeline-dot"></div>
            )}
          </div>
          <span>
            {phase === 'saving_azure' ? 'Saving to Azure Blob Storage...' : ['analyzing', 'completed'].includes(phase) ? 'Saved to Azure Blob Storage' : 'Save to Azure Blob Storage'}
          </span>
        </div>
        {azureUrl && ['analyzing', 'completed'].includes(phase) && (
          <div className="pipeline-meta">
            SAS URL: <a href={azureUrl} target="_blank" rel="noreferrer">Open blob</a>
          </div>
        )}

        {/* Step 3: Analysis */}
        <div className={`pipeline-step ${phase === 'analyzing' ? 'active' : ''} ${phase === 'completed' ? 'completed' : ''}`}>
          <div className="pipeline-icon">
            {phase === 'analyzing' ? (
              <div className="pipeline-spinner"></div>
            ) : phase === 'completed' ? (
              <span className="pipeline-check">&#x2713;</span>
            ) : (
              <div className="pipeline-dot"></div>
            )}
          </div>
          <span>
            {phase === 'analyzing' ? 'Analyzing document with Azure Content Understanding...' : phase === 'completed' ? 'Analysis complete using Azure Content Understanding' : 'Analyze document using Azure Content Understanding'}
          </span>
        </div>
      </div>
    </div>
  );
}
