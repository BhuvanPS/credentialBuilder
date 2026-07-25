from typing import Any, Dict, List


def build_credential_payload(name: str, title: str, summary: str, skills: List[Dict[str, Any]], metadata: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "credential": {
            "name": name,
            "title": title,
            "summary": summary,
            "skills": skills,
            "metadata": metadata,
        }
    }
