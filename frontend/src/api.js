const baseUrl = "http://localhost:8001";

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json();
};

export const uploadDocument = async (files, linkedinFileId = null, linkedinUrl = null) => {
  const formData = new FormData();
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("files", file);
    });
  }
  if (linkedinFileId) {
    formData.append("linkedin_file_id", linkedinFileId);
  }
  if (linkedinUrl) {
    formData.append("linkedin_url", linkedinUrl);
  }
  return request("/upload", {
    method: "POST",
    body: formData,
  });
};

export const downloadLinkedInProfile = async (url) =>
  request("/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

export const uploadToAzure = async (payload) =>
  request("/azure/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const analyzeBlobUrl = async (url) =>
  request("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

export const generateSummary = async (payload) =>
  request("/generate-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const getCandidates = () => request("/api/candidates");

export const getCandidate = (name) => request(`/api/candidates/${encodeURIComponent(name)}`);

export const saveCandidate = (payload) =>
  request("/api/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const deleteCandidate = (name) =>
  request(`/api/candidates/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
