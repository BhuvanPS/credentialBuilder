from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractResponse(BaseModel):
    file_id: str
    filename: str

class DocumentExtraction(BaseModel):
    full_name: str
    title: str
    summary: str
    url: str

class GenerateResponse(BaseModel):
    credential: Dict[str, Any]

uploaded_files: Dict[str, bytes] = {}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit")

    file_id = __import__("uuid").uuid4().hex
    uploaded_files[file_id] = contents
    return {"file_id": file_id, "filename": file.filename}

@app.post("/extract")
async def extract_document(data: Dict[str, Any]) -> DocumentExtraction:
    file_id = data.get("file_id")
    if not file_id or file_id not in uploaded_files:
        raise HTTPException(status_code=400, detail="Invalid file_id")

    raw = uploaded_files[file_id].decode("utf-8", errors="ignore")
    # Stubbed extraction, return placeholder or simple text-based fields.
    return DocumentExtraction(
        full_name="" if "Name:" not in raw else raw.split("Name:", 1)[1].splitlines()[0].strip(),
        title="" if "Title:" not in raw else raw.split("Title:", 1)[1].splitlines()[0].strip(),
        summary="" if "Summary:" not in raw else raw.split("Summary:", 1)[1].splitlines()[0].strip(),
        url="" if "http" not in raw else next((part.strip() for part in raw.split() if part.startswith("http")), ""),
    )

@app.post("/generate")
async def generate_credential(data: Dict[str, Any]) -> GenerateResponse:
    credential = {
        "full_name": data.get("full_name", ""),
        "title": data.get("title", ""),
        "summary": data.get("summary", ""),
        "url": data.get("url", ""),
    }
    return GenerateResponse(credential=credential)
