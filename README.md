# Credential Builder

An automated, premium enterprise platform designed to ingest candidate resumes/documents or LinkedIn profiles, extract structured credentials, edit prefilled details, and generate synthesized professional summaries.

---

## Entire Workflow Architecture

The platform orchestrates document processing across multiple services, APIs, and cloud engines. Below is the step-by-step workflow:

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate/Recruiter
    participant FE as React Frontend (Vite)
    participant BE as FastAPI Backend
    participant LI as LinkedIn Extractor
    participant AZ_Blob as Azure Blob Storage
    participant AZ_CU as Azure Content Understanding
    participant AZ_AI as Azure AI Agent Service

    %% Ingestion
    User->>FE: Ingest: Upload PDF/Docx OR Enter LinkedIn URL
    alt Upload Resume
        FE->>BE: POST /upload (caches file)
        BE-->>FE: Returns file_id
    else Fetch LinkedIn
        FE->>BE: POST /download (scrapes URL)
        BE->>LI: Scrape & compile profile
        LI-->>BE: Returns generated PDF path
        BE-->>FE: Returns file_id & filename
    end

    %% Storage & Content Parsing
    FE->>BE: Trigger automatic background process
    BE->>AZ_Blob: Upload document byte content
    AZ_Blob-->>BE: Returns Blob URL
    BE->>AZ_Blob: Generate Shared Access Signature (SAS) token
    BE->>AZ_CU: Submit SAS URL for extraction analysis
    Note over AZ_CU: Parsed using Custom Analyzer Schema<br/>including skill pool classifications
    AZ_CU-->>BE: Returns raw extracted JSON with confidence scores
    BE-->>FE: Returns normalized form data

    %% Editing
    Note over FE: Render Step 2: Prefilled Form<br/>showing extraction match percentages
    User->>FE: Review details & adjust skill pools
    User->>FE: Click "Generate Credential Summary"

    %% Synthesis
    FE->>FE: Immediately transition to Step 3<br/>Render animated synthesis loader
    FE->>BE: POST /generate-summary (Name, Title, Summary, Skills)
    alt Connection Active
        BE->>AZ_AI: Query SummarizingAgent (v1) with context
        AZ_AI-->>BE: Returns structured output JSON
    else Local Fallback (Dev/Offline)
        BE->>BE: Perform rule-based text synthesis
    end
    BE-->>FE: Returns synthesized Name, Title, and Profile Summary
    FE->>FE: Remove loader animation & fade in final Credential Card
    FE->>User: Display final Summary Card (Name, Title, Summary)
```

### 1. Ingestion Phase (Step 1)
- **Resume Upload**: Resumes (.pdf or .docx) are transmitted via multipart request to the backend `/upload` route and cached in-memory.
- **LinkedIn Download**: Public LinkedIn URLs are sent to the `/download` route, which delegates to the scraper service to parse layout timelines and export a local document PDF.

### 2. Cloud Storage & Authorization Pipeline
- The frontend immediately chains the cached reference through `/azure/upload`.
- The backend uploads file contents to the Azure Blob Storage container (`uploaded-files`).
- Generates a **Shared Access Signature (SAS) token** specifying read-only access (expiring in 1 hour) to grant secure access to Azure's extraction engine.

### 3. Azure Content Understanding Extraction
- The backend submits the SAS URL to the Azure Content Understanding client library.
- The document is parsed against a custom schema (`CredentialsBuilderAnalyser`) which extracts identity headers, career descriptions, and maps skills to target classification pools (e.g. Tax, Deals, Technology) based on enum matches.
- Extracted parameters are mapped back into camelCase React-friendly states.

### 4. Review & Form Adjustments (Step 2)
- The React application renders the fields in an interactive editor.
- Next to the **Title**, **Core Competencies**, and **Key Expertise** fields, the UI displays match percentage badges indicating the extraction confidence score.
- Users can review, append text list elements, and adjust matched skill pools.

### 5. AI Synthesis Loader (Step 3 Prep)
- Upon clicking *"Generate Credential Summary"*, the app immediately shifts the timeline to Step 3.
- Renders the `AISynthesisLoader` component, displaying a shimmering skeleton layout card and cycling status updates (e.g., *"Structuring executive summary layout..."*, *"Formulating profile overview paragraph..."*) to communicate background activity.

### 6. Azure AI Agent Synthesis
- In the background, a payload containing the candidate's name, title, current summary, competencies, and expertise is posted to `/generate-summary`.
- The backend initializes `AIProjectClient` to query the `SummarizingAgent` (version `1`).
- Prompts the agent to synthesize details into a high-impact executive summary and requests a structured JSON format.
- If credentials or endpoints are unavailable, a rule-based fallback synthesizes the paragraph automatically.

### 7. Preview & Card Export (Step 3)
- Once the API resolves, the loader stops and the card fades in.
- Renders the simplified profile summary card containing only the candidate's **Name**, **Title**, and synthesized **Profile Summary**.

---

## Setup & Startup Instructions

### 1. Configuration (.env)
Create a `.env` file in the root workspace folder with the following variables:
```ini
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=uploaded-files
AZURE_CONTENT_UNDERSTANDING_ENDPOINT=your_content_understanding_endpoint
CONTENT_UNDERSTANDING_KEY=your_content_understanding_api_key
ANALYZER_ID=your_analyzer_model_id
LINKEDIN_EXTRACTOR_URL=http://localhost:8000
```

### 2. Run All Services
A helper script is provided to automatically boot all services (LinkedIn Scraper, Backend, and Frontend Dev Server):
```bash
./start_all.sh
```
This starts:
- **LinkedIn Extractor** on port `8000`
- **FastAPI Backend** on port `8001`
- **React Frontend** on port `5173`/`5174`
