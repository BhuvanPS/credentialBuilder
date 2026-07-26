"""
Main FastAPI server for the Credential Builder backend.

Handles:
1. Local file upload caching.
2. LinkedIn profile scraping & extraction.
3. Azure Blob Storage integration (with SAS token generation).
4. Document analysis extraction using Azure Content Understanding.
5. AI Agent executive summary synthesis using Azure AI Projects (or local fallback).
"""

import os
import uuid
import json
from datetime import datetime, timedelta
from pathlib import Path
import httpx
from azure.core.exceptions import ResourceExistsError
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

from cu_backend.profileAnalyser import analyze_url

# Load repository-root .env config values
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="Credential Builder Backend")

# Allow cross-origin requests from the React dev server ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LINKEDIN_EXTRACTOR_URL = os.environ.get("LINKEDIN_EXTRACTOR_URL", "http://127.0.0.1:8000")
AZURE_STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_STORAGE_ACCOUNT_NAME = os.environ.get("AZURE_STORAGE_ACCOUNT_NAME", "")
AZURE_STORAGE_ACCOUNT_KEY = os.environ.get("AZURE_STORAGE_ACCOUNT_KEY", "")
AZURE_STORAGE_CONTAINER_NAME = os.environ.get("AZURE_STORAGE_CONTAINER_NAME", "uploaded-files")

# In-memory document storage (temporary cache before saving to Azure)
uploaded_files: Dict[str, bytes] = {}
uploaded_file_names: Dict[str, str] = {}


# --- PYDANTIC SCHEMAS ---

class LinkedInRequest(BaseModel):
    url: str


class AzureUploadRequest(BaseModel):
    file_id: str
    file_name: str


class AnalyzeRequest(BaseModel):
    url: str


class GenerateSummaryRequest(BaseModel):
    name: str
    title: str
    summary: str
    coreCompetencies: List[str]
    keyExpertise: List[str]


# --- HELPER UTILITIES ---

def parse_connection_string(connection_string: str) -> Dict[str, str]:
    """Parses key-value pairs from an Azure Storage connection string."""
    parts = [segment.strip() for segment in connection_string.split(";") if segment.strip()]
    values = {}
    for segment in parts:
        if "=" not in segment:
            continue
        key, value = segment.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def get_blob_service_client() -> BlobServiceClient:
    """Initializes and returns the Azure BlobServiceClient."""
    if AZURE_STORAGE_CONNECTION_STRING:
        return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

    if not AZURE_STORAGE_ACCOUNT_NAME or not AZURE_STORAGE_ACCOUNT_KEY:
        raise HTTPException(
            status_code=500,
            detail="Azure storage credentials are not configured. Set AZURE_STORAGE_CONNECTION_STRING or credentials.",
        )

    account_url = f"https://{AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net"
    return BlobServiceClient(account_url=account_url, credential=AZURE_STORAGE_ACCOUNT_KEY)


def get_sas_url(blob_name: str) -> str:
    """Generates a SAS (Shared Access Signature) URL for a given blob name (expires in 1 hour)."""
    expiry_hours = int(os.getenv("AZURE_SAS_EXPIRY_HOURS", "1"))

    account_name = AZURE_STORAGE_ACCOUNT_NAME
    account_key = AZURE_STORAGE_ACCOUNT_KEY

    if AZURE_STORAGE_CONNECTION_STRING:
        parsed = parse_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        account_name = parsed.get("AccountName")
        account_key = parsed.get("AccountKey")

    if not account_name or not account_key:
        raise HTTPException(
            status_code=500,
            detail="Azure storage credentials are not configured.",
        )

    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=AZURE_STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=expiry_hours),
    )
    return f"https://{account_name}.blob.core.windows.net/{AZURE_STORAGE_CONTAINER_NAME}/{blob_name}?{sas_token}"


def clean_json_text(text: str) -> str:
    """Removes markdown code fences (e.g. ```json) around a JSON output string."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


# --- API ROUTES ---

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Caches an uploaded resume file temporarily in-memory."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

    file_id = uuid.uuid4().hex
    uploaded_files[file_id] = contents
    uploaded_file_names[file_id] = file.filename

    return {"file_id": file_id, "filename": file.filename}


@app.post("/download")
async def download_linkedin_profile(request: LinkedInRequest) -> Dict[str, Any]:
    """Triggers the LinkedIn extractor scraper, downloads the profile PDF, and caches it in-memory."""
    if not request.url:
        raise HTTPException(status_code=400, detail="LinkedIn URL is required")

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{LINKEDIN_EXTRACTOR_URL}/download",
            json={"url": request.url},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    file_path = data.get("file_path")
    if not file_path:
        raise HTTPException(status_code=502, detail="Extractor returned no file path")

    filename = os.path.basename(file_path)
    file_id = uuid.uuid4().hex
    with open(file_path, "rb") as source_file:
        contents = source_file.read()

    uploaded_files[file_id] = contents
    uploaded_file_names[file_id] = filename

    return {"file_id": file_id, "file_path": file_path, "filename": filename}


@app.post("/azure/upload")
async def upload_to_azure(request: AzureUploadRequest) -> Dict[str, Any]:
    """Uploads cached file content directly to Azure Blob Storage and returns a SAS URL."""
    if request.file_id not in uploaded_files:
        raise HTTPException(status_code=400, detail="Invalid file_id")

    blob_service_client = get_blob_service_client()
    container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER_NAME)
    try:
        container_client.create_container()
    except ResourceExistsError:
        pass

    blob_name = os.path.basename(request.file_name) if request.file_name else uploaded_file_names.get(request.file_id, "upload")
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(uploaded_files[request.file_id], overwrite=True)

    sas_url = get_sas_url(blob_name)
    return {"blob_url": blob_client.url, "sas_url": sas_url}


@app.post("/analyze")
def analyze_blob(request: AnalyzeRequest) -> Dict[str, Any]:
    """Submits the Azure SAS URL to Azure Content Understanding to parse credentials schema."""
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required for analysis")

    try:
        result = analyze_url(request.url)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return result


@app.post("/generate-summary")
async def generate_summary(request: GenerateSummaryRequest) -> Dict[str, Any]:
    """
    Calls the Azure AI Agent service (via the Azure AI Projects SDK client) to synthesize
    a high-impact executive summary paragraph from the reviewed candidate parameters.
    
    If credentials or connections fail (e.g. in local development), it automatically 
    falls back to a rule-based formatting utility.
    """
    try:
        endpoint = "https://credentialbuilder-trial-resource.services.ai.azure.com/api/projects/credentialbuilder-trial"
        project_client = AIProjectClient(
            endpoint=endpoint,
            credential=DefaultAzureCredential(),
        )
        
        prompt = (
            "You are an expert executive resume writer.\n"
            "Synthesize a professional summary for a candidate using the following details:\n"
            f"Name: {request.name}\n"
            f"Title: {request.title}\n"
            f"Raw Summary: {request.summary}\n"
            f"Core Competencies: {', '.join(request.coreCompetencies)}\n"
            f"Key Expertise: {', '.join(request.keyExpertise)}\n\n"
            "Produce a response in JSON format matching this schema:\n"
            "{\n"
            '  "name": "...",\n'
            '  "title": "...",\n'
            '  "summary": "..."\n'
            "}\n"
            "Ensure the JSON is valid and only return the JSON content."
        )
        
        openai_client = project_client.get_openai_client()
        response = openai_client.responses.create(
            input=[{"role": "user", "content": prompt}],
            extra_body={"agent_reference": {"name": "SummarizingAgent", "version": "1", "type": "agent_reference"}},
        )
        
        output_text = getattr(response, "output_text", "")
        cleaned_text = clean_json_text(output_text)
        parsed = json.loads(cleaned_text)
        
        if isinstance(parsed, dict) and "summary" in parsed:
            return {
                "name": parsed.get("name") or request.name,
                "title": parsed.get("title") or request.title,
                "summary": parsed.get("summary")
            }
    except Exception as exc:
        print(f"Azure Agent connection failed ({exc}). Falling back to local rule-based synthesis.")
        
    # Local fallback rule-based synthesis formatting
    comps_str = ", ".join(request.coreCompetencies)
    exp_str = ", ".join(request.keyExpertise)
    
    fallback_summary = request.summary
    if exp_str:
        fallback_summary += f"\n\nSpecialized in: {exp_str}."
    if comps_str:
        fallback_summary += f"\nKey capabilities include: {comps_str}."
        
    return {
        "name": request.name,
        "title": request.title,
        "summary": fallback_summary
    }
