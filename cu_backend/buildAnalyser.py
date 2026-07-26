import os
import time
from azure.ai.contentunderstanding import ContentUnderstandingClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.contentunderstanding.models import (
    ContentAnalyzer,
    ContentAnalyzerConfig,
    ContentFieldSchema,
    ContentFieldDefinition,
    ContentFieldType,
    GenerationMethod,
)
from dotenv import load_dotenv
from pathlib import Path

# Load repository-root .env (one common source of keys)
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

# --- Client setup ---
endpoint = os.environ["AZURE_CONTENT_UNDERSTANDING_ENDPOINT"]
key = os.environ["CONTENT_UNDERSTANDING_KEY"]

client = ContentUnderstandingClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(key),
)

analyzer_id = f"CredentialsBuilderAnalyser_{int(time.time())}"

# --- Skill pool (classify fields) ---
SKILL_POOL = {
    "TaxSkills": ["Corporate tax", "International tax & transfer pricing", "Indirect tax (GST)",
                  "Tax controversy & disputes", "Tax structuring", "R&D tax incentives", "M&A tax",
                  "Tax compliance & lodgement", "ATO engagement", "Tax legislation research",
                  "Client communication", "Commercial judgement", "Attention to detail",
                  "Problem solving", "Stakeholder management"],
    "PrivateSkills": ["Business advisory", "SMSF & superannuation", "Succession & estate planning",
                       "Family office services", "Outsourced CFO", "Financial statement preparation",
                       "Trust accounting", "Cash flow & budgeting", "Private tax compliance",
                       "Wealth structuring", "Relationship building", "Empathy",
                       "Discretion & confidentiality", "Active listening", "Trusted advising"],
    "DealsSkills": ["M&A advisory", "Financial due diligence", "Valuations", "Financial modelling",
                    "IPO readiness", "Independent expert reports", "Deal structuring",
                    "Commercial due diligence", "Data analytics", "Integration & separation",
                    "Negotiation", "Project management", "Working under pressure",
                    "Insight storytelling", "Collaboration"],
    "PeopleCultureSkills": ["HR policy", "Talent acquisition", "Onboarding", "Performance management",
                            "Remuneration & benefits", "Workplace relations", "L&D program design",
                            "HRIS administration", "Workforce planning", "Diversity & inclusion",
                            "Coaching", "Conflict resolution", "Empathy", "Communication",
                            "Change management"],
    "LegalRiskSkills": ["Contract drafting & review", "Risk management frameworks", "AML/CTF compliance",
                        "Conflicts & independence", "Privacy & data protection", "Regulatory knowledge",
                        "Incident & breach management", "Dispute resolution", "Corporate governance",
                        "Legal research", "Sound judgement", "Ethical reasoning", "Influencing",
                        "Attention to detail", "Clear written communication"],
    "FinanceSkills": ["Management reporting", "Budgeting & forecasting", "Billing & WIP",
                      "Accounts payable / receivable", "Procurement", "Financial controls",
                      "Excel modelling", "Power BI & analytics", "Month-end close",
                      "Cost management", "Commercial acumen", "Accuracy", "Prioritisation",
                      "Stakeholder communication", "Problem solving"],
    "TechnologySkills": ["SharePoint & M365 administration", "Cyber security", "Power Automate",
                        "Power BI", "Copilot Studio & AI", "Networking & infrastructure",
                        "Identity & access (Entra ID)", "Service desk / ITIL", "Data management",
                        "PowerShell scripting", "Troubleshooting", "User empathy", "Communication",
                        "Collaboration", "Continuous learning"],
}

skill_field_definitions = {
    field_name: ContentFieldDefinition(
        type=ContentFieldType.ARRAY,
        method=GenerationMethod.CLASSIFY,
        description="Skills from this vertical evidenced in the document",
        item_definition=ContentFieldDefinition(
            type=ContentFieldType.STRING,
            enum=skill_list,
        ),
    )
    for field_name, skill_list in SKILL_POOL.items()
}

# --- Full field schema ---
fields = {
    # Contact / identity
    "FullName": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT,
        description="The complete name of the individual as presented at the top of the document",
    ),
    "Location": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT,
        description="The city and state or region where the individual is based",
    ),
    "PhoneNumber": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT,
        description="The primary contact phone number for the individual",
    ),
    "Email": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT,
        description="The primary email address for contacting the individual",
    ),
    "LinkedInUrl": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT,
        description="The URL to the individual's LinkedIn profile",
    ),

    # One-pager fields
    "Title": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.GENERATE,
        description="Professional title as it would appear on a one-pager, e.g. 'Partner', 'Director'",
    ),
    "RoleServiceLine": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.GENERATE,
        description="Role or service line, e.g. 'Head of Corporate Tax'",
    ),
    "Experience": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.GENERATE,
        description="Short experience summary, e.g. '18 years experience in Corporate Tax'",
    ),
    "Summary": ContentFieldDefinition(
        type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT,
        description="A brief professional summary highlighting experience, skills, and communication abilities",
    ),
    "KeyExpertise": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.GENERATE,
        description="Specific areas of expertise demonstrated across the document",
        item_definition=ContentFieldDefinition(type=ContentFieldType.STRING),
    ),
    "CoreCompetencies": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.GENERATE,
        description="Core professional competencies evidenced by the work described",
        item_definition=ContentFieldDefinition(type=ContentFieldType.STRING),
    ),
    "Certifications": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.EXTRACT,
        description="Professional certifications and qualifications, e.g. CA (ANZ), CTA, CPA Australia",
        item_definition=ContentFieldDefinition(type=ContentFieldType.STRING),
    ),
    "AffiliationsMemberships": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.EXTRACT,
        description="Professional bodies, industry groups, boards the person belongs to",
        item_definition=ContentFieldDefinition(type=ContentFieldType.STRING),
    ),
    "ClientOutcomes": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.GENERATE,
        description="Specific deals/engagements with measurable results (deal size, savings, timelines)",
        item_definition=ContentFieldDefinition(type=ContentFieldType.STRING),
    ),

    # Work experience
    "WorkExperiences": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.GENERATE,
        description="A dynamic table of the individual's professional work experiences",
        item_definition=ContentFieldDefinition(
            type=ContentFieldType.OBJECT, method=GenerationMethod.GENERATE,
            properties={
                "JobTitle": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The title or role held during the work experience"),
                "ProjectOrTeam": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The main project, product, or team associated with the role"),
                "Company": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The name of the company or organization"),
                "Location": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The city, state, or country where the work was performed"),
                "StartDate": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The month and year the work experience began"),
                "EndDate": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The month and year the work experience ended"),
                "Responsibilities": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="Key responsibilities, achievements, or projects completed"),
            },
        ),
    ),

    # Education
    "Education": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.GENERATE,
        description="A dynamic table of the individual's educational qualifications",
        item_definition=ContentFieldDefinition(
            type=ContentFieldType.OBJECT, method=GenerationMethod.GENERATE,
            properties={
                "Degree": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The academic degree or qualification obtained"),
                "Institution": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The name of the educational institution"),
                "Location": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The city or region where the institution is located"),
                "StartDate": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The month and year education began"),
                "EndDate": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The month and year education ended or is expected to end"),
                "Grade": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="Grade, GPA, WAM, or other academic performance indicator"),
                "KeySubjects": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="Key subjects, courses, or areas of study"),
            },
        ),
    ),

    # Achievements (doubles as Career Highlights)
    "AchievementsAndLeadership": ContentFieldDefinition(
        type=ContentFieldType.ARRAY, method=GenerationMethod.GENERATE,
        description="A dynamic table of notable achievements, awards, and leadership roles",
        item_definition=ContentFieldDefinition(
            type=ContentFieldType.OBJECT, method=GenerationMethod.GENERATE,
            properties={
                "Title": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="The name or title of the achievement, award, or leadership role"),
                "Description": ContentFieldDefinition(type=ContentFieldType.STRING, method=GenerationMethod.EXTRACT, description="A brief explanation of the achievement, award, or leadership responsibility"),
            },
        ),
    ),
}

# Skill classification fields built above but not merged in yet — uncomment when ready:
fields.update(skill_field_definitions)

field_schema = ContentFieldSchema(
    name="CredentialsBuilderFields",
    description="Extracts credentials profile fields and matches skills against a fixed vertical skill pool",
    fields=fields,
)

config = ContentAnalyzerConfig(
    return_details=True,
    enable_ocr=True,
    enable_layout=True,
    enable_formula=True,
    estimate_field_source_and_confidence=True,
)

analyzer = ContentAnalyzer(
    base_analyzer_id="prebuilt-document",
    description="Resume or LinkedIn profile based credentials analyser with skill-pool classification",
    config=config,
    field_schema=field_schema,
    models={
        "completion": "gpt-4.1",
        "embedding": "text-embedding-3-large",
    },
)

# --- Create it ---
poller = client.begin_create_analyzer(analyzer_id=analyzer_id, resource=analyzer)
result = poller.result()

print(f"Analyzer '{analyzer_id}' created successfully!")
print(f"  Fields ({len(field_schema.fields)}):")
for name, definition in field_schema.fields.items():
    print(f"    - {name}: {definition.type} ({definition.method})")