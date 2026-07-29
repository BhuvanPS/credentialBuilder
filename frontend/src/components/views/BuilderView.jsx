import StepTabs from '../StepTabs';
import ProcessingPipeline from '../ProcessingPipeline';
import StepIngestion from './StepIngestion';
import StepCredentials from './StepCredentials';
import StepSummary from './StepSummary';

/**
 * BuilderView — the multi-step credential building flow.
 * Orchestrates StepTabs navigation and renders the correct step panel.
 */
export default function BuilderView({
  // Navigation
  activeStep,
  unlockedStep,
  onStepClick,
  onBackToMenu,

  // Pipeline state
  processingPhase,
  fileName,
  azureUrl,

  // Step 1 props
  files,
  setFiles,
  setFileName,
  linkedinUrl,
  setLinkedinUrl,
  profilePictureUrl,
  setProfilePictureUrl,
  isDragging,
  loading,
  ingestionSource,
  onFileChange,
  onPictureChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onIngest,

  // Step 2 props
  formData,
  onTextFieldChange,
  onListItemChange,
  onAddListItem,
  onRemoveListItem,
  onSkillChange,
  onAddSkill,
  onRemoveSkill,
  onGenerateSummary,

  // Step 3 props
  summaryReady,
  summary,
  savingStatus,
  onSaveProfile,
  onGoToRepository,
}) {
  return (
    <div className="page-card">
      {/* Back nav */}
      <div className="builder-header-nav">
        <button type="button" className="secondary btn-back-menu" onClick={onBackToMenu}>
          ← Back to Main Menu
        </button>
        <span className="active-mode-label">Active Mode: Credential Builder</span>
      </div>

      <div className="page-header-title">
        <h1>Build Professional Credentials</h1>
        <p className="page-copy">
          Upload your resume or biography document to extract, prefill, and customize your credential summary.
        </p>
      </div>

      <StepTabs activeStep={activeStep} unlockedStep={unlockedStep} onStepClick={onStepClick} />

      {processingPhase !== 'idle' && (
        <ProcessingPipeline phase={processingPhase} fileName={fileName} azureUrl={azureUrl} />
      )}

      <div className="section step-section">
        {activeStep === 1 && (
          <StepIngestion
            files={files}
            setFiles={setFiles}
            setFileName={setFileName}
            linkedinUrl={linkedinUrl}
            setLinkedinUrl={setLinkedinUrl}
            profilePictureUrl={profilePictureUrl}
            setProfilePictureUrl={setProfilePictureUrl}
            isDragging={isDragging}
            loading={loading}
            processingPhase={processingPhase}
            ingestionSource={ingestionSource}
            onFileChange={onFileChange}
            onPictureChange={onPictureChange}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onIngest={onIngest}
          />
        )}

        {activeStep === 2 && (
          <StepCredentials
            formData={formData}
            loading={loading}
            onTextFieldChange={onTextFieldChange}
            onListItemChange={onListItemChange}
            onAddListItem={onAddListItem}
            onRemoveListItem={onRemoveListItem}
            onSkillChange={onSkillChange}
            onAddSkill={onAddSkill}
            onRemoveSkill={onRemoveSkill}
            onGenerateSummary={onGenerateSummary}
          />
        )}

        {activeStep === 3 && (
          <StepSummary
            loading={loading}
            summaryReady={summaryReady}
            summary={summary}
            profilePictureUrl={profilePictureUrl}
            savingStatus={savingStatus}
            formData={formData}
            onGenerateSummary={onGenerateSummary}
            onSaveProfile={onSaveProfile}
            onGoToRepository={onGoToRepository}
          />
        )}
      </div>
    </div>
  );
}
