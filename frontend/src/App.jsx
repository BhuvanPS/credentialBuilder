import { useState } from 'react';

// Hooks
import { useFormHandlers } from './hooks/useFormHandlers';
import { useIngestionPipeline } from './hooks/useIngestionPipeline';
import { useCandidateRepository } from './hooks/useCandidateRepository';

// Layout components
import Header from './components/Header';
import ErrorBanner from './components/ErrorBanner';

// View components
import WelcomeView from './components/views/WelcomeView';
import BuilderView from './components/views/BuilderView';
import RepositoryView from './components/views/RepositoryView';
import CandidateModal from './components/views/CandidateModal';

// Constants & utilities
import { initialFormData } from './constants/schema';
import { getCredentialSummary } from './utils/normalizers';

/**
 * App — root component.
 * Owns all shared state and delegates logic to custom hooks.
 * Routes between Welcome, Builder, and Repository views.
 */
export default function App() {
  // ── Shared state ─────────────────────────────────────────
  const [viewMode, setViewMode] = useState('welcome'); // 'welcome' | 'build' | 'manage'
  const [error, setError] = useState('');

  // Builder state
  const [files, setFiles] = useState([]);
  const [fileName, setFileName] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [azureUrl, setAzureUrl] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [summaryReady, setSummaryReady] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [unlockedStep, setUnlockedStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processingPhase, setProcessingPhase] = useState('idle');
  const [ingestionSource, setIngestionSource] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [savingStatus, setSavingStatus] = useState('idle');

  // Repository state
  const [candidatesList, setCandidatesList] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState(null);

  // ── Hooks ─────────────────────────────────────────────────
  const formHandlers = useFormHandlers({
    setFormData,
    setFiles,
    setFileName,
    setUploadId,
    setAzureUrl,
    setActiveStep,
    setUnlockedStep,
    setProcessingPhase,
    setIsDragging,
    setError,
    setProfilePictureUrl,
    setSavingStatus,
  });

  const pipeline = useIngestionPipeline({
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
    setSavingStatus,
  });

  const repository = useCandidateRepository({
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
  });

  const summary = getCredentialSummary(formData);

  // ── Helpers ───────────────────────────────────────────────
  const handleStepClick = (step) => {
    if (step <= unlockedStep) setActiveStep(step);
  };

  const handleStartBuild = () => {
    repository.handleStartNew({ setUploadId, setLinkedinUrl, setAzureUrl, setProcessingPhase });
  };

  const handleGoManage = async () => {
    setViewMode('manage');
    await repository.fetchCandidates();
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Header />
      <ErrorBanner error={error} />

      {viewMode === 'welcome' && (
        <WelcomeView onBuild={handleStartBuild} onManage={handleGoManage} />
      )}

      {viewMode === 'build' && (
        <BuilderView
          // Navigation
          activeStep={activeStep}
          unlockedStep={unlockedStep}
          onStepClick={handleStepClick}
          onBackToMenu={() => setViewMode('welcome')}
          // Pipeline state
          processingPhase={processingPhase}
          fileName={fileName}
          azureUrl={azureUrl}
          // Step 1
          files={files}
          setFiles={setFiles}
          setFileName={setFileName}
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          profilePictureUrl={profilePictureUrl}
          setProfilePictureUrl={setProfilePictureUrl}
          isDragging={isDragging}
          loading={loading}
          ingestionSource={ingestionSource}
          onFileChange={formHandlers.handleFileChange}
          onPictureChange={formHandlers.handlePictureChange}
          onDragOver={formHandlers.handleDragOver}
          onDragLeave={formHandlers.handleDragLeave}
          onDrop={formHandlers.handleDrop}
          onIngest={pipeline.handleIngestAndProcess}
          // Step 2
          formData={formData}
          onTextFieldChange={formHandlers.handleTextFieldChange}
          onListItemChange={formHandlers.handleListItemChange}
          onAddListItem={formHandlers.handleAddListItem}
          onRemoveListItem={formHandlers.handleRemoveListItem}
          onSkillChange={formHandlers.handleSkillChange}
          onAddSkill={formHandlers.handleAddSkill}
          onRemoveSkill={formHandlers.handleRemoveSkill}
          onGenerateSummary={pipeline.handleGenerateSummary}
          // Step 3
          summaryReady={summaryReady}
          summary={summary}
          savingStatus={savingStatus}
          onSaveProfile={repository.handleSaveProfile}
          onGoToRepository={handleGoManage}
        />
      )}

      {viewMode === 'manage' && (
        <RepositoryView
          candidatesLoading={candidatesLoading}
          candidatesList={candidatesList}
          onBackToMenu={() => setViewMode('welcome')}
          onStartNew={handleStartBuild}
          onViewDetails={repository.handleViewDetails}
          onLoadCandidate={repository.handleLoadCandidate}
          onDeleteCandidate={repository.handleDeleteCandidate}
        />
      )}

      <CandidateModal
        candidate={selectedCandidateDetail}
        onClose={() => setSelectedCandidateDetail(null)}
        onEdit={(name) => {
          setSelectedCandidateDetail(null);
          repository.handleLoadCandidate(name);
        }}
      />
    </div>
  );
}
