# LinkedIn Profile Scraper Service

A FastAPI microservice that downloads public LinkedIn profiles and compiles them into a structured PDF document.

## Purpose

- Accepts public LinkedIn profile URL queries.
- Connects to LinkedIn endpoints or web scraping libraries.
- Compiles the retrieved timeline history, education, and skills.
- Exports a formatted PDF document to local directories, which is subsequently parsed by the Azure Content Understanding engine.

## Execution

1. Start the microservice:
   ```bash
   python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```
