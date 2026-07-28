import { STEP_TITLES } from '../constants/schema';

/**
 * StepTabs component renders a timeline of steps (1, 2, 3) representing the progress
 * through the credential building workflow.
 *
 * @param {object} props
 * @param {number} props.activeStep - Currently active timeline stage (1, 2, or 3)
 * @param {function} props.onStepClick - Callback when a unlocked timeline tab is clicked
 */
export default function StepTabs({ activeStep, unlockedStep = activeStep, onStepClick }) {
  return (
    <div className="step-tabs">
      {STEP_TITLES.map((step) => (
        <button
          key={step.id}
          type="button"
          className={`step-tab ${activeStep === step.id ? 'active' : ''} ${unlockedStep > step.id ? 'complete' : ''}`}
          onClick={() => onStepClick(step.id)}
          disabled={step.id > unlockedStep}
        >
          <span className="step-number">{step.id}</span>
          <span className="step-label">{step.label}</span>
        </button>
      ))}
    </div>
  );
}
