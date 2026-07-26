from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from linkedin_downloader import download_profile_pdf
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="LinkedIn PDF Downloader"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174","http://localhost:5173"],  
    allow_methods=["*"],
    allow_headers=["*"],
)
class LinkedInRequest(BaseModel):
    url: str

@app.post("/download")
def download_linkedin_pdf(
    request: LinkedInRequest
):
    try:
        file_path = download_profile_pdf(request.url)
        return {
            "success": True,
            "file_path": file_path
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e))