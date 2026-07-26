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

  return (
    <div className="pipeline-container">
      <div className="pipeline-title">Document Processing Pipeline</div>
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
