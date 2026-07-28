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
