"""
A simple analyzer helper for Azure Content Understanding.

This module exposes `analyze_url(file_url)` so the backend can send the uploaded blob SAS URL
into Azure Content Understanding and return the parsed result.
"""

import os
import sys
import json
import argparse
from typing import Any, Dict

from dotenv import load_dotenv
from azure.ai.contentunderstanding import ContentUnderstandingClient
from azure.ai.contentunderstanding.models import AnalysisInput, AnalysisResult
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
from azure.identity import DefaultAzureCredential

load_dotenv()


def get_analysis_client() -> ContentUnderstandingClient:
    endpoint = os.getenv(
        "AZURE_CONTENT_UNDERSTANDING_ENDPOINT",
        "https://credentialbuilder-trial-resource.services.ai.azure.com/",
    ).strip()
    key = os.getenv("CONTENT_UNDERSTANDING_KEY", "").strip()
    api_version = os.getenv("CONTENT_UNDERSTANDING_API_VERSION", "2025-11-01")

    if not endpoint:
        raise ValueError("AZURE_CONTENT_UNDERSTANDING_ENDPOINT must be set in the backend environment.")

    if key and key.upper() == "CONTENT_UNDERSTANDING_KEY":
        raise ValueError("CONTENT_UNDERSTANDING_KEY is a placeholder value. Set the real key in backend/.env.")

    credential = AzureKeyCredential(key) if key else DefaultAzureCredential()
    return ContentUnderstandingClient(endpoint=endpoint, credential=credential, api_version=api_version)


def analyze_url(file_url: str) -> Dict[str, Any]:
    analyzer_id = os.getenv("ANALYZER_ID", "ProfileAnalyser")
    client = get_analysis_client()

    poller = client.begin_analyze(
        analyzer_id=analyzer_id,
        inputs=[AnalysisInput(url=file_url)],
    )
    result: AnalysisResult = poller.result()
    return result.as_dict()


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a file URL using Azure Content Understanding")
    parser.add_argument("--file-url", required=True, help="Publicly accessible file URL to analyze")
    args = parser.parse_args()

    file_url = args.file_url
    print(f"Analyzing with analyzer: {os.getenv('ANALYZER_ID', 'ProfileAnalyser')}")
    print(f"  File URL: {file_url}\n")

    try:
        result = analyze_url(file_url)
    except AzureError as err:
        print(f"[Azure Error]: {err.message}")
        sys.exit(1)
    except Exception as ex:
        print(f"[Unexpected Error]: {ex}")
        sys.exit(1)

    print("=" * 50)
    print("Analysis result:")
    print("=" * 50 + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
