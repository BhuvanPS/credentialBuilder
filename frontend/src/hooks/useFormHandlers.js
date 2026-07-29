import { initialFormData } from '../constants/schema';

/**
 * Custom hook that encapsulates all formData mutation handlers.
 * Keeps App.jsx free of low-level field manipulation logic.
 *
 * @param {object} formData - Current form state
 * @param {Function} setFormData - State setter from parent
 * @param {Function} setFiles - File list setter (needed for reset on file change)
 * @param {Function} setFileName
 * @param {Function} setUploadId
 * @param {Function} setAzureUrl
 * @param {Function} setActiveStep
 * @param {Function} setUnlockedStep
 * @param {Function} setProcessingPhase
 * @param {Function} setIsDragging
 * @param {Function} setError
 * @param {Function} setProfilePictureUrl
 * @returns {object} All form and file handlers
 */
export function useFormHandlers({
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
}) {
  /** Updates a single text list item value by index. */
  const handleListItemChange = (key, index, newValue) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      list[index] = { value: newValue, confidence: list[index]?.confidence ?? null };
      return { ...prev, [key]: list };
    });
  };

  /** Appends an empty item to a list field. */
  const handleAddListItem = (key) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: [...list, { value: '', confidence: null }] };
    });
  };

  /** Removes a list item by index. */
  const handleRemoveListItem = (key, index) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: list.filter((_, i) => i !== index) };
    });
  };

  /** Updates a skill pool item's value or confidence slider. */
  const handleSkillChange = (key, index, field, value) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const item = { ...(list[index] || { value: '', confidence: 1.0 }) };
      if (field === 'value') {
        item.value = value;
      } else if (field === 'confidence') {
        const floatVal = parseFloat(value);
        item.confidence = isNaN(floatVal) ? null : Math.min(1, Math.max(0, floatVal / 100));
      }
      list[index] = item;
      return { ...prev, [key]: list };
    });
  };

  /** Appends a new skill entry with full confidence. */
  const handleAddSkill = (key) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: [...list, { value: '', confidence: 1.0 }] };
    });
  };

  /** Removes a skill entry by index. */
  const handleRemoveSkill = (key, index) => {
    setFormData((prev) => {
      const list = Array.isArray(prev[key]) ? [...prev[key]] : [];
      return { ...prev, [key]: list.filter((_, i) => i !== index) };
    });
  };

  /** Updates a plain text field preserving confidence metadata. */
  const handleTextFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: { value: value ?? '', confidence: prev[key]?.confidence ?? null },
    }));
  };

  /** Handles file input selection — deduplicates and resets pipeline state. */
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

  /** Reads a profile picture file and stores it as a data URL. */
  const handlePictureChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePictureUrl(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  /** Drag-and-drop handlers for the resume dropzone. */
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const selectedFiles = Array.from(event.dataTransfer.files || []);
    if (selectedFiles.length > 0) {
      const validFiles = [];
      const invalidFiles = [];

      selectedFiles.forEach((f) => {
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext === 'pdf' || ext === 'docx') validFiles.push(f);
        else invalidFiles.push(f.name);
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

  return {
    handleListItemChange,
    handleAddListItem,
    handleRemoveListItem,
    handleSkillChange,
    handleAddSkill,
    handleRemoveSkill,
    handleTextFieldChange,
    handleFileChange,
    handlePictureChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
