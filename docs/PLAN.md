# Research Digest Agent — implementation plan

## Product goal

Turn one research topic into a transparent, cited Markdown report through four visible stages: plan, search, synthesize, and refine.

## Milestones

1. Scaffold a deployable Next.js App Router project and verify a base page.
2. Generate 3–5 non-overlapping research questions with OpenAI Structured Outputs.
3. Search DuckDuckGo HTML for each question and normalize/deduplicate sources.
4. Synthesize a cited draft, critique it, and refine it into the final report.
5. Build the single-page topic input and report view.
6. Stream newline-delimited progress events into a four-stage tracker.
7. Polish loading, error, responsive, download, and deployment behavior.

## Architecture

- `app/page.tsx`: client-facing single-page research workspace.
- `app/api/research/route.ts`: streamed server-side orchestration endpoint.
- `lib/openai.ts`: OpenAI Responses API planning and writing stages.
- `lib/search.ts`: DuckDuckGo HTML retrieval and parsing.
- `lib/research.ts`: pipeline coordination, validation, and report metadata.
- `components/`: focused UI pieces for progress and Markdown output.

The API emits NDJSON events so the UI can update immediately without a database or separate streaming service.

## Verification gates

- Static checks: TypeScript, ESLint, production build.
- Unit tests: query/source validation, search parsing, URL normalization.
- Integration: real OpenAI planning and DuckDuckGo search when credentials/network are available.
- Browser: idle, loading/progress, completed report, Markdown download, and validation/error states.
