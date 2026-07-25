from typing import Dict, Any


def extract_text_from_blob(blob_data: bytes) -> Dict[str, Any]:
    return {
        "text": blob_data.decode("utf-8", errors="ignore"),
        "language": "en",
        "source": "azure_content_understanding",
    }
