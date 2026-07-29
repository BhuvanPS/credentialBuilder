import CredentialForm from '../CredentialForm';
import SkillPoolsEditor from '../SkillPoolsEditor';

/**
 * StepCredentials — Step 2 of the credential builder.
 * Renders the prefilled form editor, skill pool sliders, and the
 * Generate Credential Summary action button.
 */
export default function StepCredentials({
  formData,
  loading,
  onTextFieldChange,
  onListItemChange,
  onAddListItem,
  onRemoveListItem,
  onSkillChange,
  onAddSkill,
  onRemoveSkill,
  onGenerateSummary,
}) {
  return (
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
            onTextFieldChange={onTextFieldChange}
            onListItemChange={onListItemChange}
            onAddListItem={onAddListItem}
            onRemoveListItem={onRemoveListItem}
          />
        </div>

        <SkillPoolsEditor
          formData={formData}
          onSkillChange={onSkillChange}
          onAddSkill={onAddSkill}
          onRemoveSkill={onRemoveSkill}
        />

        <div className="summary-actions">
          <button
            className="secondary"
            type="button"
            onClick={onGenerateSummary}
            disabled={loading || !formData?.fullName?.value}
          >
            Generate Credential Summary
          </button>
        </div>
      </div>
    </div>
  );
}
