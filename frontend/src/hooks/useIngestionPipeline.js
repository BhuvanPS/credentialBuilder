import { uploadDocument, downloadLinkedInProfile, uploadToAzure, analyzeBlobUrl, generateSummary } from '../api';
import { cleanFormData, normalizeAnalysisFormData } from '../utils/normalizers';

/**
 * Custom hook encapsulating the full document ingestion and AI synthesis pipeline.
 *
 * Phases covered:
 *  uploading    → LinkedIn scrape + local file upload
 *  saving_azure → push merged PDF to Azure Blob Storage
 *  analyzing    → Content Understanding extraction
 *  completed    → form populated, move to Step 2
 *  (generateSummary) → Azure AI agent synthesis, move to Step 3
 */
export function useIngestionPipeline({
  files,
  linkedinUrl,
  formData,
  setFormData,
  setUploadId,
  setFileName,
  setAzureUrl,
  setSummaryReady,
  setActiveStep,
  setUnlockedStep,
  setError,
  setLoading,
  setProcessingPhase,
  setIngestionSource,
}) {
  /**
   * Phase 2–3 background pipeline:
   * Uploads cached file to Azure Blob, runs Content Understanding, populates form.
   */
  const processDocument = async (fileId, name) => {
    setError('');
    setLoading(true);
    setProcessingPhase('saving_azure');

    try {
      const azureResult = await uploadToAzure({ file_id: fileId, file_name: name });
      const sasUrl = azureResult.sas_url || azureResult.blob_url || '';
      setAzureUrl(sasUrl);

      setProcessingPhase('analyzing');
      const analysis = await analyzeBlobUrl(sasUrl);

      if (analysis?.formData) {
        setFormData(cleanFormData(normalizeAnalysisFormData(analysis.formData)));
      }

      setProcessingPhase('completed');
      setActiveStep(2);
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
   * Unified ingestion entrypoint:
   * 1. Optionally scrapes a LinkedIn profile to PDF.
   * 2. Uploads and merges local files with LinkedIn PDF.
   * 3. Runs the Azure Blob + Content Understanding pipeline.
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

    setIngestionSource(files.length > 0 ? 'resume' : 'linkedin');
    setProcessingPhase('uploading');

    try {
      const uploadResult = await uploadDocument(files, linkedinFileId, linkedinUrl.trim() || null);
      setUploadId(uploadResult.file_id || '');
      setFileName(uploadResult.filename || 'merged_credentials.pdf');
      await processDocument(uploadResult.file_id, uploadResult.filename || 'merged_credentials.pdf');
    } catch (err) {
      setError(`Processing failed: ${err.message || err}`);
      setProcessingPhase('idle');
      setLoading(false);
      setIngestionSource(null);
    }
  };

  /**
   * Calls the Azure AI Agent to synthesize an executive summary from reviewed form fields.
   * Immediately transitions to Step 3 to display the loading animation.
   */
  const handleGenerateSummary = async () => {
    if (!formData?.fullName?.value) {
      setError('No analyzed credential data is available to generate a summary.');
      return;
    }

    setError('');
    setLoading(true);
    setSummaryReady(false);
    setActiveStep(3);
    setUnlockedStep((prev) => Math.max(prev, 3));

    try {
      const payload = {
        name: formData.fullName?.value || '',
        title: formData.title?.value || '',
        summary: formData.summary?.value || '',
        coreCompetencies: (formData.coreCompetencies || []).map((i) => i.value).filter(Boolean),
        keyExpertise: (formData.keyExpertise || []).map((i) => i.value).filter(Boolean),
      };

      const result = await generateSummary(payload);

      setFormData((prev) => ({
        ...prev,
        fullName: { value: result.name || prev.fullName?.value || '', confidence: prev.fullName?.confidence ?? null },
        title: { value: result.title || prev.title?.value || '', confidence: prev.title?.confidence ?? null },
        summary: { value: result.summary || prev.summary?.value || '', confidence: prev.summary?.confidence ?? null },
      }));

      setSummaryReady(true);
    } catch (err) {
      setError(err.message || 'Failed to generate summary.');
      setActiveStep(2);
    } finally {
      setLoading(false);
    }
  };

  return { processDocument, handleIngestAndProcess, handleGenerateSummary };
}
