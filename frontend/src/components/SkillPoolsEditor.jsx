import { SKILL_POOL_FIELDS } from '../constants/schema';

/**
 * SkillPoolsEditor renders a slider/number grid editor for matching skill pools
 * along with their respective extraction or alignment confidence scores.
 *
 * @param {object} props
 * @param {object} props.formData - Standard React state object for all credentials
 * @param {function} props.onSkillChange - Callback for adjusting skill name or confidence score
 * @param {function} props.onAddSkill - Callback for adding a new blank skill match
 * @param {function} props.onRemoveSkill - Callback for removing a skill match
 */
export default function SkillPoolsEditor({
  formData,
  onSkillChange,
  onAddSkill,
  onRemoveSkill,
}) {
  return (
    <div className="analysis-card skill-pools-card">
      <div className="analysis-card-header">
        <h3>Skill Pool Matches</h3>
        <p className="analysis-card-copy">Review and adjust matched skills from the skill pool along with their confidence scores.</p>
      </div>
      
      <div className="skill-pools-container">
        {SKILL_POOL_FIELDS.map(({ key, label }) => {
          const list = Array.isArray(formData[key]) ? formData[key] : [];
          return (
            <div className="skill-pool-group" key={key}>
              <h4 className="skill-pool-title">{label}</h4>
              <div className="skill-pool-list">
                {list.length === 0 ? (
                  <span className="no-skills-hint">No skills matched.</span>
                ) : (
                  list.map((item, index) => {
                    const confidencePct = item?.confidence != null ? Math.round(item.confidence * 100) : '';
                    return (
                      <div className="skill-item-row" key={index}>
                        <input
                          type="text"
                          className="skill-value-input"
                          placeholder="Skill name"
                          value={item?.value || ''}
                          onChange={(e) => onSkillChange(key, index, 'value', e.target.value)}
                        />
                        <div className="confidence-input-wrapper">
                          <input
                            type="number"
                            className="skill-confidence-input"
                            placeholder="0-100"
                            min="0"
                            max="100"
                            value={confidencePct}
                            onChange={(e) => onSkillChange(key, index, 'confidence', e.target.value)}
                          />
                          <span className="percent-sign">%</span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove-skill"
                          onClick={() => onRemoveSkill(key, index)}
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <button
                type="button"
                className="btn-add-skill"
                onClick={() => onAddSkill(key)}
              >
                + Add Skill Match
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
