import { useState } from "react";
import { uploadDocument, extractDocument, generateCredential } from "./api";

const steps = ["Upload", "Extract", "Review", "Generate"];

export default function App() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({ full_name: "", title: "", summary: "", url: "" });
  const [autoFilled, setAutoFilled] = useState({ full_name: false, title: false, summary: false, url: false });
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Select a PDF or DOCX file first.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be 10MB or smaller.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await uploadDocument(file);
      setUploadId(result.file_id || "");
      setFileName(result.filename || file.name);
      setStep(1);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!uploadId) {
      setError("Missing uploaded file.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await extractDocument({ file_id: uploadId });
      setFields({
        full_name: result.full_name || "",
        title: result.title || "",
        summary: result.summary || "",
        url: result.url || "",
      });
      setAutoFilled({
        full_name: Boolean(result.full_name),
        title: Boolean(result.title),
        summary: Boolean(result.summary),
        url: Boolean(result.url),
      });
      setStep(2);
    } catch (err) {
      setError(err.message || "Extraction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await generateCredential(fields);
      setCredential(result.credential || fields);
      setStep(3);
    } catch (err) {
      setError(err.message || "Generate failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setFields((curr) => ({ ...curr, [key]: value }));
  };

  return (
    <div className="app-shell">
      <div className="progress-bar" aria-label="Progress">
        {steps.map((label, index) => (
          <div key={label} className={`progress-step ${index <= step ? "active" : ""}`}>
            <span className="progress-number">{index + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="page-card">
        <h1>myCredentials</h1>
        <p className="page-copy">Upload a resume and turn it into a consistent HNP credential summary card.</p>

        {error && <div className="error-banner">{error}</div>}

        {step === 0 && (
          <div className="section">
            <label className="input-file">
              <span>Choose PDF or DOCX</span>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  setFile(selected);
                  setFileName(selected?.name || "");
                }}
              />
            </label>
            <p className="hint">Maximum size 10MB.</p>
          </div>
        )}

        {step === 1 && (
          <div className="section">
            <p className="hint">Ready to extract from <strong>{fileName}</strong>.</p>
            <button className="primary" onClick={handleExtract} disabled={loading}>
              {loading ? "Extracting…" : "Extract content"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="section form-grid">
            {[
              { key: "full_name", label: "Full name" },
              { key: "title", label: "Title" },
              { key: "summary", label: "Summary", textarea: true },
              { key: "url", label: "URL" },
            ].map((field) => (
              <label key={field.key} className="field-row">
                <div className="field-header">
                  <span>{field.label}</span>
                  <span className={`badge ${autoFilled[field.key] ? "filled" : "pending"}`}>
                    {autoFilled[field.key] ? "✓ auto-filled" : "○ needs input"}
                  </span>
                </div>
                {field.textarea ? (
                  <textarea
                    value={fields[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    value={fields[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="credential-card">
            <div className="card-header">
              <span className="card-brand">myCredentials</span>
              <span className="card-label">HNP</span>
            </div>
            <h2>{credential?.full_name || ""}</h2>
            <p className="card-title">{credential?.title || ""}</p>
            <p className="card-summary">{credential?.summary || ""}</p>
            <p className="card-url">{credential?.url || ""}</p>
          </div>
        )}
      </div>

      <div className="action-row">
        {step > 0 && step < 3 && (
          <button className="secondary" onClick={() => setStep(step - 1)} disabled={loading}>
            Back
          </button>
        )}

        {step === 0 && (
          <button className="primary" onClick={handleUpload} disabled={!file || loading}>
            {loading ? "Uploading…" : "Upload"}
          </button>
        )}

        {step === 2 && (
          <button className="primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating…" : "Generate credential"}
          </button>
        )}
      </div>
    </div>
  );
}
