# TracePilot: AI Code Review Assistant

TracePilot is an AI-powered code review tool that analyzes frontend and full-stack code for bugs, security risks, performance issues, and production-readiness concerns. It uses Gemini for code review generation and Respan / Keywords AI for LLM observability, request logging, token tracking, latency monitoring, and prompt comparison workflows.

The project was built to explore practical AI-assisted development workflows: prompting, evaluating model outputs, tracing LLM calls, comparing prompt versions, and turning AI-generated feedback into a developer-facing product.

## Demo Features

- AI code review for React, Next.js, TypeScript, Python, and API route snippets
- Structured production-readiness output with scores, issues, summaries, and fixes
- Respan / Keywords AI logging for each LLM request
- Token and latency tracking for model observability
- Prompt version comparison across production, security, and performance review prompts
- Clean Next.js dashboard built for developer-tool workflows

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- AI Model: Gemini 2.5 Flash
- Observability: Respan / Keywords AI
- Backend: Next.js API Routes
- Tooling: Git, npm, Vercel-ready deployment

## Why This Project

Most AI code assistants generate feedback but do not make it easy to inspect how the model behaved. TracePilot adds an observability layer around AI code review by tracking model latency, prompt versions, token usage, review scores, issue counts, and logged traces in Respan.

This makes the project useful not only as a code review assistant, but also as a small developer tool for testing and improving AI-assisted engineering workflows.

## How It Works

1. A user pastes a code snippet or PR-style diff into the dashboard.
2. TracePilot sends the code to a Gemini-powered review endpoint.
3. The model returns structured JSON with a score, issue count, bugs, security risks, performance issues, production-readiness notes, and suggested fixes.
4. The backend logs each LLM request to Respan / Keywords AI with metadata such as prompt version, latency, token usage, review score, issue count, model, and workflow type.
5. The prompt comparison workflow runs three prompt variants and identifies the strongest prompt based on review score.

## Prompt Versions

TracePilot currently supports three review prompts:

- `production-frontend-v1`: Focuses on frontend correctness, React/Next.js best practices, TypeScript safety, accessibility, maintainability, and production readiness.
- `security-focused-v1`: Prioritizes security risks, unsafe data handling, validation issues, injection risks, and unsafe browser behavior.
- `performance-focused-v1`: Prioritizes rendering performance, client-side routing, image optimization, caching, unnecessary recomputation, and scalability.

## Screenshots

Screenshots demonstrate the main dashboard, AI review output, Respan logging status, prompt comparison workflow, and Respan dashboard metrics.

## Local Development

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
RESPAN_API_KEY=your_respan_api_key_here
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Getting API Keys

- **Gemini API Key**: Create a key at [Google AI Studio](https://aistudio.google.com/app/apikey). The project uses `gemini-2.5-flash`.
- **Respan API Key**: Sign up at [Respan](https://respan.ai) and generate an API key from your dashboard. This enables LLM request logging, token tracking, and latency monitoring.

## API Routes

### `POST /api/review`

Runs a single AI code review using the selected prompt version.

**Request body:**
```json
{
  "code": "// your code here",
  "language": "TypeScript",
  "promptVersion": "production-frontend-v1"
}
```

**Response:**
```json
{
  "review": {
    "score": 72,
    "summary": "...",
    "bugs": ["..."],
    "securityRisks": ["..."],
    "performanceIssues": ["..."],
    "productionReadiness": ["..."],
    "suggestedFixes": ["..."]
  },
  "metadata": {
    "model": "gemini-2.5-flash",
    "latencyMs": 1840,
    "promptVersion": "production-frontend-v1",
    "language": "TypeScript",
    "promptTokens": 312,
    "completionTokens": 198,
    "totalTokens": 510,
    "respanLogged": true
  }
}
```

### `POST /api/compare`

Runs all three prompt versions against the same code and returns ranked results.

**Request body:**
```json
{
  "code": "// your code here",
  "language": "TypeScript"
}
```

**Response:**
```json
{
  "results": [
    {
      "promptVersion": "production-frontend-v1",
      "score": 72,
      "issueCount": 8,
      "latencyMs": 1840,
      "totalTokens": 510,
      "summary": "..."
    }
  ],
  "bestPromptVersion": "security-focused-v1"
}
```

## Respan Observability

Every review request and prompt comparison run is logged to Respan with the following metadata:

| Field | Description |
|---|---|
| `app_name` | `TracePilot` |
| `workflow` | `ai_code_review` or `prompt_comparison` |
| `provider` | `google_gemini` |
| `prompt_version` | Which of the three prompts was used |
| `review_score` | Score returned by Gemini (0–100) |
| `issue_count` | Total bugs + risks + performance + readiness items |
| `latency_ms` | End-to-end model latency in milliseconds |
| `code_length` | Character count of the submitted code |
| `environment` | `local_dev` |

Logging failures are caught silently and do not affect the review response.

## Project Structure

```
tracepilot/
├── app/
│   ├── layout.tsx              # Root layout with Geist fonts
│   ├── page.tsx                # Main dashboard UI
│   ├── globals.css             # Tailwind v4 + theme variables
│   └── api/
│       ├── review/route.ts     # POST /api/review
│       └── compare/route.ts    # POST /api/compare
├── public/                     # Static assets
├── .env.local                  # API keys (not committed)
├── next.config.ts
├── postcss.config.mjs
└── package.json
```

## Key Implementation Details

- Uses server-side Next.js API routes to keep Gemini and Respan API keys out of the browser.
- Forces Gemini responses into structured JSON for consistent frontend rendering.
- Includes a resilient JSON parser for model outputs that may contain malformed escaping.
- Logs each review and prompt comparison run to Respan with workflow metadata, latency, token estimates, model name, review score, and issue count.
- Supports prompt comparison across three review strategies to evaluate which prompt performs best for a given code sample.