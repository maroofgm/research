# Fieldnote — Research Digest Agent

Fieldnote turns one research topic into a refined, cited Markdown digest. Its four-stage agent loop stays visible in the UI:

1. Plan 3–5 focused research queries.
2. Search the live web through DuckDuckGo HTML.
3. Synthesize an evidence-led report with numbered citations.
4. Critique and refine the draft, then score evidence confidence.

The product is a single-page Next.js application with one streamed API route, no database, no authentication, and no search API key.

## Requirements

- Node.js 20.9 or newer
- pnpm 11 (recommended) or npm
- An OpenAI API key with access to the configured model

## Local setup

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Configure `.env.local`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-terra
```

`gpt-5.6-terra` is the balanced default. The API key is used only in the server route and is never sent to the browser.

## Quality checks

```bash
pnpm test
pnpm lint
pnpm build
```

Tests cover DuckDuckGo parsing, redirect and unsafe URL handling, report filename generation, citation bounds, and canonical source-list output.

## Architecture

```text
app/page.tsx                   Page shell
app/api/research/route.ts     NDJSON streaming orchestration route
components/                   Topic form, live tracker, report UI
lib/openai.ts                 Plan, synthesis, and refinement model calls
lib/search.ts                 DuckDuckGo retrieval, parsing, deduplication
lib/research.ts               Filename and canonical report finalization
lib/types.ts                  Shared pipeline and event contracts
docs/PLAN.md                  Milestones and verification gates
```

The browser sends one `POST /api/research` request. The route emits newline-delimited JSON events as each stage becomes active or completes. The final event contains the report, source list, critique, confidence score, and download filename.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it into Vercel as a Next.js project.
3. Add `OPENAI_API_KEY` and `OPENAI_MODEL` in **Project Settings → Environment Variables**.
4. Deploy. No database or other integration is required.

The route allows up to 60 seconds for the full research loop. Confirm that the selected Vercel plan supports that function duration.

## Product boundaries

- Search results provide titles and snippets; full-page source extraction is not part of the MVP.
- Confidence is the model editor’s assessment of the gathered evidence, not a guarantee of factual correctness.
- DuckDuckGo HTML is an external page format and may require parser maintenance if its markup changes.
- Markdown export is generated in the browser; no report is persisted server-side.
