# Credential Builder Frontend

A modern, high-end React SPA built with Vite. It features a three-step timeline workflow:
1. **Ingest/Scrape**: Drag-and-drop file upload or LinkedIn URL query.
2. **Review & Adjust**: A prefilled form showing extraction confidence match percentages, along with editable skill pool levels.
3. **Synthesis**: Immediate transition to an animated loading screen followed by a synthesized final credential card rendering.

## Technology Stack

- **Framework**: React 18+ (Vite)
- **Styling**: Vanilla CSS (no CSS frameworks for flexibility, maximum responsiveness, and custom transitions)
- **API Client**: Native `fetch` wrapper targeting local FastAPI server endpoints

## Folder Structure

```
frontend/
├── src/
│   ├── components/         # Modular rendering components
│   │   ├── Header.jsx      # Application brand layout
│   │   ├── StepTabs.jsx    # Timeline navigation tracker
│   │   ├── CredentialForm.jsx    # Prefilled form displaying confidence scores
│   │   ├── SkillPoolsEditor.jsx  # Skill matrices and confidence sliders
│   │   ├── CredentialCard.jsx    # Shimmering loader & final preview card
│   │   └── ProcessingPipeline.jsx # Stepped ingestion loader tracker
│   ├── constants/
│   │   └── schema.js       # Field validation schema structures
│   ├── utils/
│   │   └── normalizers.js  # Field sanitizers and array flattening helpers
│   ├── api.js              # Fetch backend client wrapper
│   ├── App.jsx             # Core orchestrator component
│   └── styles.css          # Premium SaaS custom CSS stylesheet
└── package.json
```

## Running Locally

1. Install package dependencies:
   ```bash
   npm install
   ```
2. Start the hot-reloading development server:
   ```bash
   npm run dev
   ```
3. Build production bundle assets:
   ```bash
   npm run build
   ```
