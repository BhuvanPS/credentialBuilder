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
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [azureUrl, setAzureUrl] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [summaryReady, setSummaryReady] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Explicitly track the ingestion/analysis pipeline phase
  // Values: 'idle' | 'uploading' | 'saving_azure' | 'analyzing' | 'completed'
  const [processingPhase, setProcessingPhase] = useState('idle');

  // --- NAVIGATION HANDLERS ---
  const handleStepClick = (step) => {
    // Only allow navigating back to previously unlocked steps
    if (step <= activeStep) {
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

  /**
   * Standard file input selection event. Clears processing states.
   */
  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileName(selected?.name || '');
    setUploadId('');
    setAzureUrl('');
    setFormData(initialFormData);
    setActiveStep(1);
    setProcessingPhase('idle');
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
    } catch (err) {
      setError(err.message || 'Processing failed.');
      setProcessingPhase('idle');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Uploads file to backend server local cache and initiates background processing.
   */
  const handleUploadResume = async () => {
    if (!file) {
      setError('Select a resume file first.');
      return;
    }
    setError('');
    setLoading(true);
    setProcessingPhase('uploading');
    setAzureUrl('');
    setSummaryReady(false);

    try {
      const result = await uploadDocument(file);
      setUploadId(result.file_id || '');
      setFileName(result.filename || file.name);
      
      // Chain background Azure upload & analysis
      await processDocument(result.file_id, result.filename || file.name);
    } catch (err) {
      setError(err.message || 'Upload failed.');
      setProcessingPhase('idle');
      setLoading(false);
    }
  };

  /**
   * Downloads LinkedIn PDF file via scraper and initiates background processing.
   */
  const handleFetchProfile = async () => {
    if (!linkedinUrl.trim()) {
      setError('Enter a LinkedIn profile URL first.');
      return;
    }
    setError('');
    setLoading(true);
    setProcessingPhase('uploading');
    setAzureUrl('');
    setSummaryReady(false);

    try {
      const result = await downloadLinkedInProfile(linkedinUrl.trim());
      const filename = result.file_path ? result.file_path.split(/[/\\]/).pop() : 'LinkedIn profile';
      setFileName(filename);
      setUploadId(result.file_id || '');
      
      // Chain background Azure upload & analysis
      await processDocument(result.file_id, filename);
    } catch (err) {
      setError(err.message || 'Profile download failed.');
      setProcessingPhase('idle');
      setLoading(false);
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

        <StepTabs activeStep={activeStep} onStepClick={handleStepClick} />

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
            <div className="step-card">
              <h2>Step 1: Upload or Fetch</h2>
              <div className="step-content">
                <label className="input-file">
                  <span>Upload resume</span>
                  <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
                </label>
                <button className="primary" onClick={handleUploadResume} disabled={!file || loading}>
                  {loading && processingPhase === 'uploading' ? 'Uploading...' : 'Upload Resume'}
                </button>
                <div className="divider">or</div>
                <label className="field-row">
                  <span>LinkedIn profile URL</span>
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/in/example"
                    value={linkedinUrl}
                    onChange={(event) => setLinkedinUrl(event.target.value)}
                  />
                </label>
                <button className="secondary" onClick={handleFetchProfile} disabled={!linkedinUrl.trim() || loading}>
                  {loading && processingPhase === 'uploading' ? 'Fetching...' : 'Fetch profile PDF'}
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
                  <CredentialCard summary={summary} />
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
