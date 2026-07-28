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
from pathlib import Path
from azure.ai.contentunderstanding import ContentUnderstandingClient
from azure.ai.contentunderstanding.models import AnalysisInput, AnalysisResult
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError
from azure.identity import DefaultAzureCredential

env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)


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
        raise ValueError("CONTENT_UNDERSTANDING_KEY is a placeholder value. Set the real key in the repository root .env file.")

    credential = AzureKeyCredential(key) if key else DefaultAzureCredential()
    return ContentUnderstandingClient(endpoint=endpoint, credential=credential, api_version=api_version)


FORM_FIELDS = [
    "FullName",
    "Location",
    "PhoneNumber",
    "Email",
    "LinkedInUrl",
    "Title",
    "RoleServiceLine",
    "Experience",
    "Summary",
    "KeyExpertise",
    "CoreCompetencies",
    "Certifications",
    "AffiliationsMemberships",
    "ClientOutcomes",
    "WorkExperiences",
    "Education",
    "AchievementsAndLeadership",
    "TaxSkills",
    "PrivateSkills",
    "DealsSkills",
    "PeopleCultureSkills",
    "LegalRiskSkills",
    "FinanceSkills",
    "TechnologySkills",
]

FIELD_NAME_MAP = {
    "FullName": "fullName",
    "Location": "location",
    "PhoneNumber": "phoneNumber",
    "Email": "email",
    "LinkedInUrl": "linkedInUrl",
    "Title": "title",
    "RoleServiceLine": "roleServiceLine",
    "Experience": "experience",
    "Summary": "summary",
    "KeyExpertise": "keyExpertise",
    "CoreCompetencies": "coreCompetencies",
    "Certifications": "certifications",
    "AffiliationsMemberships": "affiliationsMemberships",
    "ClientOutcomes": "clientOutcomes",
    "WorkExperiences": "workExperiences",
    "Education": "education",
    "AchievementsAndLeadership": "achievementsAndLeadership",
    "TaxSkills": "taxSkills",
    "PrivateSkills": "privateSkills",
    "DealsSkills": "dealsSkills",
    "PeopleCultureSkills": "peopleCultureSkills",
    "LegalRiskSkills": "legalRiskSkills",
    "FinanceSkills": "financeSkills",
    "TechnologySkills": "technologySkills",
}

STRING_FIELDS = {
    "FullName",
    "Location",
    "PhoneNumber",
    "Email",
    "LinkedInUrl",
    "Title",
    "RoleServiceLine",
    "Experience",
    "Summary",
}


def _extract_value(field: Any) -> Any:
    if field is None:
        return None

    if isinstance(field, dict):
        if "valueString" in field:
            return {
                "value": field.get("valueString", ""),
                "confidence": field.get("confidence"),
            }
        if "valueArray" in field:
            values = []
            for item in field.get("valueArray", []):
                extracted = _extract_value(item)
                if extracted is None:
                    continue
                if isinstance(extracted, list) and len(extracted) == 0:
                    continue
                values.append(extracted)
            return values
        if "valueObject" in field:
            obj = {}
            for key, child in field["valueObject"].items():
                extracted = _extract_value(child)
                if extracted is not None and extracted != "":
                    obj[key] = extracted
            return obj

    if isinstance(field, list):
        values = []
        for item in field:
            extracted = _extract_value(item)
            if extracted is None:
                continue
            if isinstance(extracted, list) and len(extracted) == 0:
                continue
            values.append(extracted)
        return values

    return field


def _normalize_analysis_result(raw_result: Dict[str, Any]) -> Dict[str, Any]:
    form_data = {}
    normalized_result = raw_result.get("result", raw_result) if isinstance(raw_result, dict) else {}
    contents = normalized_result.get("contents", [])
    raw_fields = contents[0].get("fields", {}) if contents else {}

    for field_name in FORM_FIELDS:
        form_key = FIELD_NAME_MAP.get(field_name, field_name)
        if field_name in raw_fields:
            value = _extract_value(raw_fields[field_name])
        elif field_name in STRING_FIELDS:
            value = {"value": "", "confidence": None}
        else:
            value = []

        if value is None:
            value = {"value": "", "confidence": None} if field_name in STRING_FIELDS else []
        form_data[form_key] = value

    return {
        "status": normalized_result.get("status") or raw_result.get("status"),
        "analyzerId": normalized_result.get("analyzerId"),
        "apiVersion": normalized_result.get("apiVersion"),
        "formData": form_data,
    }


def analyze_url(file_url: str) -> Dict[str, Any]:
    analyzer_id = os.getenv("ANALYZER_ID", "").strip()
    if not analyzer_id:
        raise ValueError("ANALYZER_ID environment variable is missing or empty. Please set it in the repository root .env file.")
        
    client = get_analysis_client()

    poller = client.begin_analyze(
        analyzer_id=analyzer_id,
        inputs=[AnalysisInput(url=file_url)],
    )
    result: AnalysisResult = poller.result()
    raw_result = result.as_dict()
    return _normalize_analysis_result(raw_result)


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a file URL using Azure Content Understanding")
    parser.add_argument("--file-url", required=True, help="Publicly accessible file URL to analyze")
    args = parser.parse_args()

    file_url = args.file_url
    

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
