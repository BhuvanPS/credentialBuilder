import { FORM_RENDER_FIELDS } from '../constants/schema';

export default function CredentialForm({
  formData,
  onTextFieldChange,
  onListItemChange,
  onAddListItem,
  onRemoveListItem,
}) {
  return (
    <div className="form-container">
      {/* 2-Column Grid for basic info */}
      <div className="form-grid-2col">
        {FORM_RENDER_FIELDS.slice(0, 4).map(({ key, label }) => (
          <div className="form-field-group" key={key}>
            <label className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{label}</span>
              {formData[key]?.confidence != null && (
                <span className="field-confidence-badge" title="Extraction confidence">
                  {Math.round(formData[key].confidence * 100)}% Match
                </span>
              )}
            </label>
            <div className="field-input">
              <input
                type="text"
                value={formData[key]?.value || ''}
                placeholder={`Enter ${label.toLowerCase()}`}
                onChange={(event) => onTextFieldChange(key, event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Full width List Fields */}
      <div className="form-lists-container">
        {FORM_RENDER_FIELDS.slice(4).map(({ key, label, type, placeholder, addButtonLabel }) => {
          const list = Array.isArray(formData[key]) ? formData[key] : [];
          return (
            <div className="list-field-group" key={key}>
              <label className="list-label">{label}</label>
              {placeholder && <p className="list-sublabel">{placeholder}</p>}
              
              <div className="list-inputs-list">
                {list.map((item, index) => (
                  <div className="list-item-row" key={index}>
                    {type === 'textareaList' ? (
                      <textarea
                        value={item?.value || ''}
                        rows={3}
                        onChange={(event) => onListItemChange(key, index, event.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={item?.value || ''}
                        onChange={(event) => onListItemChange(key, index, event.target.value)}
                      />
                    )}
                    {item?.confidence != null && (
                      <span className="item-confidence-badge" title="Extraction confidence">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => onRemoveListItem(key, index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                className="btn-add-item"
                onClick={() => onAddListItem(key)}
              >
                {addButtonLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
