import { getCandidates, getCandidate, saveCandidate, deleteCandidate } from '../api';
import { getCredentialSummary } from '../utils/normalizers';
import { initialFormData } from '../constants/schema';

/**
 * Custom hook encapsulating all candidate repository operations:
 * listing, viewing, saving, loading into the builder, and deleting.
 */
export function useCandidateRepository({
  formData,
  profilePictureUrl,
  summaryReady,
  setFormData,
  setProfilePictureUrl,
  setFiles,
  setFileName,
  setSummaryReady,
  setActiveStep,
  setUnlockedStep,
  setViewMode,
  setCandidatesList,
  setCandidatesLoading,
  setSelectedCandidateDetail,
  setSavingStatus,
  setError,
}) {
  /** Fetches all candidates from the database and populates the list. */
  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    setError('');
    try {
      const list = await getCandidates();
      setCandidatesList(list || []);
    } catch (err) {
      setError(`Failed to fetch candidates: ${err.message || err}`);
    } finally {
      setCandidatesLoading(false);
    }
  };

  /**
   * Saves the current form state and synthesized summary to the database.
   * Requires that the summary card has already been generated (summaryReady = true).
   */
  const handleSaveProfile = async () => {
    if (!formData?.fullName?.value) {
      setError('Please ensure the candidate name is filled out in Step 2.');
      return;
    }
    const summaryData = getCredentialSummary(formData);
    if (!summaryData || !summaryReady) {
      setError('Synthesize the summary card first before saving.');
      return;
    }

    setSavingStatus('saving');
    setError('');
    try {
      await saveCandidate({
        name: formData.fullName.value,
        title: formData.title.value,
        profile_picture_url: profilePictureUrl,
        form_data: formData,
        summary_data: summaryData,
      });
      setSavingStatus('success');
    } catch (err) {
      setError(`Failed to save candidate: ${err.message || err}`);
      setSavingStatus('error');
    }
  };

  /**
   * Loads a candidate record from the database back into the builder form.
   * Switches the view to 'build' mode at Step 2 with all steps unlocked.
   */
  const handleLoadCandidate = async (name) => {
    setCandidatesLoading(true);
    setError('');
    try {
      const details = await getCandidate(name);
      if (details) {
        setFormData(details.form_data);
        setProfilePictureUrl(details.profile_picture_url);
        setSummaryReady(true);
        setFiles([]);
        setFileName('');
        setSavingStatus('success');
        setViewMode('build');
        setActiveStep(2);
        setUnlockedStep(3);
      }
    } catch (err) {
      setError(`Failed to load candidate: ${err.message || err}`);
    } finally {
      setCandidatesLoading(false);
    }
  };

  /** Deletes a candidate after user confirmation and refreshes the list. */
  const handleDeleteCandidate = async (name) => {
    if (!window.confirm(`Are you sure you want to delete the profile for ${name}?`)) return;
    setError('');
    try {
      await deleteCandidate(name);
      await fetchCandidates();
    } catch (err) {
      setError(`Failed to delete candidate: ${err.message || err}`);
    }
  };

  /** Fetches full candidate detail and opens the modal overlay. */
  const handleViewDetails = async (name) => {
    setError('');
    try {
      const details = await getCandidate(name);
      setSelectedCandidateDetail(details);
    } catch (err) {
      setError(`Failed to fetch details: ${err.message || err}`);
    }
  };

  /** Resets builder state and switches to a fresh 'build' session. */
  const handleStartNew = (setters) => {
    const { setUploadId, setLinkedinUrl, setAzureUrl, setProcessingPhase } = setters;
    setFiles([]);
    setFileName('');
    setUploadId('');
    setLinkedinUrl('');
    setAzureUrl('');
    setProfilePictureUrl(null);
    setFormData(initialFormData);
    setSummaryReady(false);
    setSavingStatus('idle');
    setActiveStep(1);
    setUnlockedStep(1);
    setProcessingPhase('idle');
    setViewMode('build');
  };

  return {
    fetchCandidates,
    handleSaveProfile,
    handleLoadCandidate,
    handleDeleteCandidate,
    handleViewDetails,
    handleStartNew,
  };
}
