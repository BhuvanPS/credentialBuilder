import { useState } from "react";
import { uploadDocument, downloadLinkedInProfile, uploadToAzure, analyzeBlobUrl } from "./api";

export default function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadPath, setDownloadPath] = useState("");
  const [azureStatus, setAzureStatus] = useState("");
  const [azureUrl, setAzureUrl] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileName(selected?.name || "");
    setUploadId("");
    setAzureStatus("");
    setAzureUrl("");
    setDownloadStatus("");
    setDownloadPath("");
  };

  const handleUploadResume = async () => {
    if (!file) {
      setError("Select a resume file first.");
      return;
    }

    setError("");
    setLoading(true);
    setAzureStatus("");
    setAzureUrl("");

    try {
      const result = await uploadDocument(file);
      setUploadId(result.file_id || "");
      setFileName(result.filename || file.name);
      setDownloadStatus("Resume uploaded to backend.");
      setDownloadPath(result.filename || file.name);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProfile = async () => {
    if (!linkedinUrl.trim()) {
      setError("Enter a LinkedIn profile URL first.");
      return;
    }

    setError("");
    setLoading(true);
    setAzureStatus("");
    setAzureUrl("");
    setDownloadStatus("Fetching profile PDF...");
    setDownloadPath("");

    try {
      const result = await downloadLinkedInProfile(linkedinUrl.trim());
      setDownloadStatus("Profile PDF downloaded.");
      setDownloadPath(result.file_path || "");
      setFileName(result.file_path || "LinkedIn profile");
      setUploadId(result.file_id || "");
    } catch (err) {
      setError(err.message || "Profile download failed.");
      setDownloadStatus("Failed to download profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAzure = async () => {
    if (!uploadId) {
      setError("No file available to upload to Azure.");
      return;
    }

    setError("");
    setLoading(true);
    setAzureStatus("Uploading to Azure...");
    setAzureUrl("");
    setAnalysisStatus("");
    setAnalysisResult(null);

    try {
      const result = await uploadToAzure({ file_id: uploadId, file_name: fileName });
      setAzureStatus("Uploaded to Azure Blob Storage.");
      setAzureUrl(result.sas_url || result.blob_url || "");
      setAnalysisStatus(result.sas_url ? "Ready for analysis." : "Azure upload succeeded, but no SAS URL available for analysis.");
    } catch (err) {
      setError(err.message || "Azure upload failed.");
      setAzureStatus("Azure upload failed.");
      setAnalysisStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeBlob = async () => {
    if (!azureUrl) {
      setError("No Azure blob URL is available for analysis.");
      return;
    }

    setError("");
    setLoading(true);
    setAnalysisStatus("Analyzing uploaded document...");
    setAnalysisResult(null);

    try {
      const analysis = await analyzeBlobUrl(azureUrl);
      setAnalysisStatus("Analysis complete.");
      setAnalysisResult(analysis);
    } catch (err) {
      setError(err.message || "Analysis failed.");
      setAnalysisStatus("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page-card">
        <h1>Credential Builder</h1>
        <p className="page-copy">Upload a resume or fetch a LinkedIn profile PDF, then save it to Azure Blob Storage.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="section">
          <label className="input-file">
            <span>Upload resume</span>
            <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
          </label>
          <button className="primary" onClick={handleUploadResume} disabled={!file || loading}>
            {loading && downloadStatus === "" ? "Uploading…" : "Upload Resume"}
          </button>
        </div>

        <div className="divider">or</div>

        <div className="section">
          <label className="field-row">
            <span>LinkedIn profile URL</span>
            <input
              type="url"
              placeholder="https://www.linkedin.com/in/example"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
            />
          </label>
          <button className="secondary" onClick={handleFetchProfile} disabled={!linkedinUrl.trim() || loading}>
            {loading && downloadStatus === "Fetching profile PDF..." ? "Fetching…" : "Fetch profile PDF"}
          </button>
        </div>

        <div className="section status-panel">
          {downloadStatus && <p className="hint">{downloadStatus}</p>}
          {downloadPath && <p className="hint">Path: <code>{downloadPath}</code></p>}
          {azureStatus && <p className="hint">{azureStatus}</p>}
          {azureUrl && (
            <p className="hint">
              SAS URL: <a href={azureUrl} target="_blank" rel="noreferrer">Open blob</a>
            </p>
          )}
          {analysisStatus && <p className="hint">{analysisStatus}</p>}
          {analysisResult && (
            <div className="analysis-result">
              <h2>Analysis Result</h2>
              <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="section">
          <button className="primary" onClick={handleUploadAzure} disabled={!uploadId || loading}>
            {loading && azureStatus === "Uploading to Azure..." ? "Saving…" : "Save to Azure"}
          </button>
          <button
            className="secondary"
            onClick={handleAnalyzeBlob}
            disabled={!azureUrl || loading}
            style={{ marginLeft: "1rem" }}
          >
            {loading && analysisStatus === "Analyzing uploaded document..." ? "Analyzing…" : "Analyze Blob"}
          </button>
        </div>
      </div>
    </div>
  );
}
