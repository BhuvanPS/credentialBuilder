# Credential Builder Backend

FastAPI Python server coordinating storage operations, document ingestion, and executive summary synthesis.

## Features

- **Upload Caching**: Caches uploaded documents temporarily in-memory.
- **Azure Blob Storage Client**: Moves raw document assets to Azure containers and constructs temporary Shared Access Signature (SAS) URLs.
- **Content Understanding Client**: Submits SAS URLs to Azure Content Understanding, running pre-built schemas to extract fields.
- **AI Agent Synthesis**: Interfaces with the `azure-ai-projects` SDK using `DefaultAzureCredential` to call `SummarizingAgent` (version `1`) to synthesize the candidate summary.
- **Local Fallback**: Automatically falls back to formatted, rule-based text synthesis if Azure OpenAI project endpoint is offline or credentials are not defined.

## Folder Structure

```
backend/
├── main.py              # FastAPI application logic and routers
└── requirements.txt     # Python package requirements list
```

## Setup & Execution

1. Initialize a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install Python package requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend service:
   ```bash
   python3 -m uvicorn main:app --reload --port 8001
   ```
