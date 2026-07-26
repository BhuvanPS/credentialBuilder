# Azure Content Understanding Integration

A helper module containing the Azure Content Understanding provisioning and extraction logic.

## Purpose

- **Schema Definition**: Declares all candidate resume properties, career attributes, and classification categories (such as Tax, Deals, and Technology skill pools).
- **Model Provisioning**: Creates and configures the Custom Document Analyzer instance in Azure AI Content Understanding.
- **Analysis Execution**: Submits SAS document URLs to the provisioned analyzer and formats the extraction response.

## File Structure

```
cu_backend/
├── buildAnalyser.py    # Registers and deploys the custom analyzer model schema to Azure Content Understanding
├── profileAnalyser.py  # Performs analysis execution by querying SAS URLs and parsing result dictionaries
└── sample_result.json  # Mock analysis response body structure for offline testing reference
```

## Setup & Provisioning

To deploy or rebuild the analyzer schema in your Azure AI Content Understanding service:

1. Ensure your `.env` contains valid endpoints and keys:
   ```ini
   AZURE_CONTENT_UNDERSTANDING_ENDPOINT=https://your-endpoint.services.ai.azure.com/
   CONTENT_UNDERSTANDING_KEY=your_api_key
   ```
2. Execute the provisioning script:
   ```bash
   python3 buildAnalyser.py
   ```
   This will register a new analyzer config (e.g. `CredentialsBuilderAnalyser_<timestamp>`) containing all field extractions and enum classification lists.
