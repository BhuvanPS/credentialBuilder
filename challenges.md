# Technical Challenges & Constraints

This document outlines the major architectural challenges, limitations, and operational constraints identified during the development of the Credential Builder platform.

---

## 1. LinkedIn Ingestion and Anti-Scraping Blocks

### Challenge
Direct HTTP scraping (using libraries like `requests` or `BeautifulSoup`) or standard headless scraping APIs are immediately flagged and blocked by LinkedIn's anti-bot detection walls (resulting in `403 Forbidden`, login redirection, or CAPTCHA requests).

### Mitigation & Solution
The platform uses **Selenium Browser Automation** instead of raw HTTP calls. 
- Controls an actual Google Chrome browser engine to simulate authentic human behavior (scrolling, hover actions).
- Configured to run on the host's native Chrome session path. By loading the candidate profile in a real browser containing the user's active session cookie cache, it bypasses authentication barriers.

---

## 2. Concurrency Limits of Stateful Browser Profiles

### Challenge
Google Chrome profiles are highly **stateful**. When Selenium launches a browser instance pointing to the custom user profile folder (`/Users/bhuvanps/LinkedInAutomationChrome`), Chrome creates lockfiles (`SingletonLock`). If another request triggers a concurrent browser launch using the same profile path, the Chrome process will fail to start or throw profile lock errors.

### Mitigation & Solution
- **Single-Request Processing**: The LinkedIn scraper service is architecturally constrained to handle **one download request at a time**. 
- **Future Scale**: To handle multi-user concurrent scraping, the service would need a queue/worker pool (e.g. Celery or Redis Queue) to serialize execution, or allocate distinct Chrome profiles dynamically per worker thread.

---

## 3. Immutable Document Analyzer Schema

### Challenge
The Azure Content Understanding custom analyzer model schema (`CredentialsBuilderAnalyser`) is **immutable** once compiled and registered on the Azure AI services resource. Individual field keys or classification arrays cannot be modified or deleted in-place on an active model ID.

### Mitigation & Solution
- **Schema Lock**: The frontend normalizers and backend endpoints are tightly coupled to the registered field keys (like `FullName`, `Title`, `KeyExpertise`).
- **Redeployment Rule**: Any updates to the fields or skill lists require modifying `buildAnalyser.py`, incrementing the version/timestamp suffix to build a new model ID, and updating the `ANALYZER_ID` variable in the environment configuration (.env).

---

## 4. Microsoft Fabric SQL Database Connection via pyodbc

### Challenge
Connecting the FastAPI backend to a **Microsoft Fabric SQL Database** over TDS using `pyodbc` involved a problems:

1. **`pymssql` Incompatibility**: The originally planned `pymssql` package does not support the `Authentication=ActiveDirectoryInteractive` auth scheme used by Fabric SQL. The switch to `pyodbc` was necessary to support ODBC-based connection strings.



### Mitigation & Solution

- **Driver**: Installed `msodbcsql18` via Homebrew using `brew tap microsoft/mssql-release && HOMEBREW_ACCEPT_EULA=Y brew install msodbcsql18`. Required emptying the Trash to remove Xcode from Homebrew's path scan.

- **MFA Authentication**: Instead of using interactive or service principal auth modes, the backend was refactored to use the **Azure Access Token injection approach**:
  - The developer runs `az login` in a foreground terminal once (completing MFA in the browser).
  - The backend calls `DefaultAzureCredential().get_token("https://database.windows.net/.default")` on startup.
  - The resulting token is encoded as `UTF-16LE` bytes with a 4-byte little-endian length prefix.
  - The token binary is passed directly to `pyodbc.connect()` via `attrs_before={1256: token_struct}`, bypassing all interactive authentication flows entirely.
  - The `Authentication=...` keyword is stripped from the connection string programmatically to prevent conflicts with the token injection approach.
