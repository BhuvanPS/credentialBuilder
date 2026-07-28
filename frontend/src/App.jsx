import { useState } from 'react';
import { uploadDocument, downloadLinkedInProfile, uploadToAzure, analyzeBlobUrl, generateSummary } from './api';

// Components
import Header from './components/Header';
import StepTabs from './components/StepTabs';
import CredentialForm from './components/CredentialForm';
import SkillPoolsEditor from './components/SkillPoolsEditor';
import CredentialCard, { AISynthesisLoader } from './components/CredentialCard';
import ProcessingPipeline from './components/ProcessingPipeline';

// Constants & Utilities
import { initialFormData } from './constants/schema';
import { cleanFormData, normalizeAnalysisFormData, getCredentialSummary } from './utils/normalizers';

/**
 * App component orchestrates the document ingestion, Azure Blob Storage pipeline,
 * Azure Content Understanding analysis extraction, and the final AI summary card generation.
 */
export default function App() {
  // --- STATE DECLARATIONS ---
  const [files, setFiles] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [azureUrl, setAzureUrl] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [summaryReady, setSummaryReady] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [unlockedStep, setUnlockedStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [ingestionSource, setIngestionSource] = useState(null); // 'resume' | 'linkedin' | null
  
  // Explicitly track the ingestion/analysis pipeline phase
  // Values: 'idle' | 'uploading' | 'saving_azure' | 'analyzing' | 'completed'
  const [processingPhase, setProcessingPhase] = useState('idle');
  const [isDragging, setIsDragging] = useState(false);

  // --- NAVIGATION HANDLERS ---
  const handleStepClick = (step) => {
    // Only allow navigating back to previously unlocked steps
    if (step <= unlockedStep) {
      setActiveStep(step);
    }
  };

  // --- FORM DATA HANDLERS ---
  
  /**
   * Handles text updates for individual list items.
   */
  const handleListItemChange = (key, index, newValue) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      list[index] = { value: newValue, confidence: list[index]?.confidence ?? null };
      return { ...prev, [key]: list };
    });
  };

  /**
   * Appends an empty text list item.
   */
  const handleAddListItem = (key) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: [...list, { value: '', confidence: null }] };
    });
  };

  /**
   * Removes a list item by its index.
   */
  const handleRemoveListItem = (key, index) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: list.filter((_, i) => i !== index) };
    });
  };

  /**
   * Handles skill name and confidence scale updates.
   */
  const handleSkillChange = (key, index, field, value) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const item = { ...(list[index] || { value: '', confidence: 1.0 }) };
      if (field === 'value') {
        item.value = value;
      } else if (field === 'confidence') {
        const floatVal = parseFloat(value);
        // Scale percentage input back to a decimal (0.0 to 1.0)
        item.confidence = isNaN(floatVal) ? null : Math.min(1, Math.max(0, floatVal / 100));
      }
      list[index] = item;
      return { ...prev, [key]: list };
    });
  };

  /**
   * Appends a new skill match with full confidence.
   */
  const handleAddSkill = (key) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: [...list, { value: '', confidence: 1.0 }] };
    });
  };

  /**
   * Removes a matched skill from a pool.
   */
  const handleRemoveSkill = (key, index) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: list.filter((_, i) => i !== index) };
    });
  };

  /**
   * Handles updates to text field values (e.g. Name, Title).
   */
  const handleTextFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        value: value ?? '',
        confidence: prev[key]?.confidence ?? null,
      },
    }));
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 0) {
      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const uniqueNew = selected.filter((f) => !existingNames.has(f.name));
        const updated = [...prev, ...uniqueNew];
        setFileName(updated.length === 1 ? updated[0].name : `${updated.length} files attached`);
        return updated;
      });
      setUploadId('');
      setAzureUrl('');
      setFormData(initialFormData);
      setActiveStep(1);
      setUnlockedStep(1);
      setProcessingPhase('idle');
    }
  };

  /**
   * Handles professional picture file selection and converts it to a data URL.
   */
  const handlePictureChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePictureUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  /**
   * Drag-and-drop event handlers for resume dropzone.
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const selectedFiles = Array.from(event.dataTransfer.files || []);
    if (selectedFiles.length > 0) {
      const validFiles = [];
      const invalidFiles = [];
      
      selectedFiles.forEach((f) => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext === 'pdf' || ext === 'docx') {
          validFiles.push(f);
        } else {
          invalidFiles.push(f.name);
        }
      });
      
      if (invalidFiles.length > 0) {
        setError(`Unsupported file types: ${invalidFiles.join(', ')}. Only PDF and DOCX are allowed.`);
      }
      
      if (validFiles.length > 0) {
        setFiles((prev) => {
          const existingNames = new Set(prev.map((f) => f.name));
          const uniqueNew = validFiles.filter((f) => !existingNames.has(f.name));
          const updated = [...prev, ...uniqueNew];
          setFileName(updated.length === 1 ? updated[0].name : `${updated.length} files attached`);
          return updated;
        });
        setUploadId('');
        setAzureUrl('');
        setFormData(initialFormData);
        setActiveStep(1);
        setUnlockedStep(1);
        setProcessingPhase('idle');
      }
    }
  };

  // --- BACKGROUND PIPELINE HANDLERS ---

  /**
   * Sequential background process:
   * 1. Saves uploaded file reference to Azure Blob Storage.
   * 2. Runs Azure Content Understanding document extraction analyzer.
   * 3. Normalizes extracted payload fields and populates form state.
   */
  const processDocument = async (fileId, name) => {
    setError('');
    setLoading(true);
    setProcessingPhase('saving_azure');

    try {
      // Phase 1: Upload to Azure Blob container
      const azureResult = await uploadToAzure({ file_id: fileId, file_name: name });
      const sasUrl = azureResult.sas_url || azureResult.blob_url || '';
      setAzureUrl(sasUrl);

      // Phase 2: Run Content Understanding Analysis
      setProcessingPhase('analyzing');
      const analysis = await analyzeBlobUrl(sasUrl);
      
      // Phase 3: Normalize and parse extracted form fields
      if (analysis?.formData) {
        setFormData(cleanFormData(normalizeAnalysisFormData(analysis.formData)));
      }
      setProcessingPhase('completed');
      setActiveStep(2); // Automatically swap tab to prefilled form editor
      setUnlockedStep((prev) => Math.max(prev, 2));
    } catch (err) {
      setError(err.message || 'Processing failed.');
      setProcessingPhase('idle');
    } finally {
      setLoading(false);
      setIngestionSource(null);
    }
  };

  /**
   * Unified document and profile ingestion pipeline:
   * 1. If LinkedIn URL is present, fetches and caches it as a PDF.
   * 2. Uploads local files and/or merges them with the fetched LinkedIn PDF.
   * 3. Saves final merged PDF to Azure Blob Storage and initiates Content Understanding analysis.
   */
  const handleIngestAndProcess = async () => {
    if (files.length === 0 && !linkedinUrl.trim()) {
      setError('Please attach at least one document or enter a LinkedIn URL.');
      return;
    }

    setError('');
    setLoading(true);
    setAzureUrl('');
    setSummaryReady(false);

    let linkedinFileId = null;

    // Phase 1: Scrape LinkedIn profile if specified
    if (linkedinUrl.trim()) {
      setIngestionSource('linkedin');
      setProcessingPhase('uploading');
      try {
        const result = await downloadLinkedInProfile(linkedinUrl.trim());
        linkedinFileId = result.file_id;
      } catch (err) {
        setError(`LinkedIn Scraper Failed: ${err.message || err}`);
        setProcessingPhase('idle');
        setLoading(false);
        setIngestionSource(null);
        return;
      }
    }

    // Phase 2: Upload local documents and merge with LinkedIn (if present)
    setIngestionSource(files.length > 0 ? 'resume' : 'linkedin');
    setProcessingPhase('uploading');
    try {
      const uploadResult = await uploadDocument(files, linkedinFileId, linkedinUrl.trim() || null);
      setUploadId(uploadResult.file_id || '');
      setFileName(uploadResult.filename || 'merged_credentials.pdf');
      
      // Phase 3: Save to Azure Blob Storage and Analyze
      await processDocument(uploadResult.file_id, uploadResult.filename || 'merged_credentials.pdf');
    } catch (err) {
      setError(`Processing failed: ${err.message || err}`);
      setProcessingPhase('idle');
      setLoading(false);
      setIngestionSource(null);
    }
  };

  /**
   * Calls the Azure AI project client to generate a synthesized executive summary,
   * updates local form state, and transitions view to Step 3.
   */
  const handleGenerateSummary = async () => {
    if (!formData?.fullName?.value) {
      setError('No analyzed credential data is available to generate a summary.');
      return;
    }
    setError('');
    setLoading(true);
    setSummaryReady(false);
    setActiveStep(3); // Switch view immediately to Step 3 to play loader/shimmer
    setUnlockedStep((prev) => Math.max(prev, 3));

    try {
      // Gather payload details from reviewed form fields
      const payload = {
        name: formData.fullName?.value || '',
        title: formData.title?.value || '',
        summary: formData.summary?.value || '',
        coreCompetencies: (formData.coreCompetencies || []).map((item) => item.value).filter(Boolean),
        keyExpertise: (formData.keyExpertise || []).map((item) => item.value).filter(Boolean),
      };

      const result = await generateSummary(payload);

      // Populate synthesized parameters into form state
      setFormData((prev) => ({
        ...prev,
        fullName: { value: result.name || prev.fullName?.value || '', confidence: prev.fullName?.confidence ?? null },
        title: { value: result.title || prev.title?.value || '', confidence: prev.title?.confidence ?? null },
        summary: { value: result.summary || prev.summary?.value || '', confidence: prev.summary?.confidence ?? null },
      }));

      setSummaryReady(true);
    } catch (err) {
      setError(err.message || 'Failed to generate summary.');
      setActiveStep(2); // Fallback user to step 2 editor on failure
    } finally {
      setLoading(false);
    }
  };

  const summary = getCredentialSummary(formData);

  return (
    <div className="app-shell">
      <Header />

      <div className="page-card">
        <div className="page-header-title">
          <h1>Build Professional Credentials</h1>
          <p className="page-copy">Upload your resume or biography document to extract, prefill, and customize your credential summary.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <StepTabs activeStep={activeStep} unlockedStep={unlockedStep} onStepClick={handleStepClick} />

        {/* Ingestion & Analysis Timeline tracker */}
        {processingPhase !== 'idle' && (
          <ProcessingPipeline
            phase={processingPhase}
            fileName={fileName}
            azureUrl={azureUrl}
          />
        )}

        <div className="section step-section">
          {/* STEP 1: UPLOAD / LINKEDIN FETCH */}
          {activeStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
              
              {/* STANDALONE PHOTO UPLOAD CARD */}
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
                        onChange={handlePictureChange} 
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
                    /* Photo Attachment preview row */
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

              <div className="ingestion-grid">
                
                {/* CARD 1: LOCAL FILE INGESTION */}
                <div className="ingestion-card">
                  <div className="ingestion-card-header">
                    <h3>Upload Local Resume</h3>
                    <p>Choose a PDF or Word document from your computer or drag it directly into the zone below.</p>
                  </div>
                  
                  <div className="ingestion-card-body">
                    {/* File Selector Dropzone */}
                    <div 
                      className={`dropzone ${isDragging ? 'dragging' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('resume-file-input').click()}
                    >
                      <input 
                        type="file" 
                        id="resume-file-input" 
                        accept=".pdf,.docx" 
                        multiple
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                      />
                      <div className="dropzone-icon-wrapper">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="dropzone-title">Drag & Drop files here</p>
                      <p className="dropzone-subtitle">or click to browse from finder (PDF or DOCX up to 10MB)</p>
                    </div>

                    {/* Attached Files List */}
                    {files.length > 0 && (
                      <div className="attachment-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '16px' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-dark-muted)', textTransform: 'uppercase' }}>Attached Files ({files.length})</p>
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

                {/* CARD 2: LINKEDIN PROFILE SCRAPER */}
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
                          onChange={(event) => setLinkedinUrl(event.target.value)}
                        />
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              {/* UNIFIED ACTION BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button 
                  className="primary" 
                  style={{ minWidth: '340px', padding: '14px 32px', fontSize: '1rem' }}
                  onClick={handleIngestAndProcess} 
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
                        : (files.length > 0 ? 'Process Ingested Resume' : 'Import from LinkedIn')}
                    </span>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: PREFILLED FORM EDITOR & SKILL POOLS */}
          {activeStep === 2 && (
            <div className="step-card">
              <h2>Step 2: Your credentials</h2>
              <div className="step-content">
                <div className="analysis-card">
                  <div className="analysis-card-header">
                    <h3>Prefilled Form</h3>
                    <p className="analysis-card-copy">Complete the fields below.</p>
                  </div>
                  
                  <CredentialForm
                    formData={formData}
                    onTextFieldChange={handleTextFieldChange}
                    onListItemChange={handleListItemChange}
                    onAddListItem={handleAddListItem}
                    onRemoveListItem={handleRemoveListItem}
                  />
                </div>

                <SkillPoolsEditor
                  formData={formData}
                  onSkillChange={handleSkillChange}
                  onAddSkill={handleAddSkill}
                  onRemoveSkill={handleRemoveSkill}
                />

                <div className="summary-actions">
                  <button
                    className="secondary"
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={loading || !formData?.fullName?.value}
                  >
                    Generate Credential Summary
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW CREDENTIAL DOCUMENT */}
          {activeStep === 3 && (
            <div className="step-card">
              <h2>Step 3: Credential Summary</h2>
              <div className="step-content">
                {loading ? (
                  <AISynthesisLoader />
                ) : summaryReady ? (
                  <CredentialCard summary={summary} pictureUrl={profilePictureUrl} />
                ) : (
                  <div className="summary-placeholder">
                    <p className="hint">Summary has not been generated yet. Click the button on Step 2 after analysis completes.</p>
                    <button className="primary" type="button" onClick={handleGenerateSummary} disabled={loading || !formData?.fullName?.value}>
                      Generate Credential Summary
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
