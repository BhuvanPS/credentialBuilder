const baseUrl = "http://localhost:8000";

const request = async (path, options = {}) => {
  const res = await fetch(`${baseUrl}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json();
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request("/upload", {
    method: "POST",
    body: formData,
  });
};

export const extractDocument = async (payload) =>
  request("/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

export const generateCredential = async (payload) =>
  request("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
