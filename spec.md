# NanoBanana Prompt Refinery — Technology Stack Spec (MVP)

## 1) Objective
Define the minimal, production-sane technology stack to ship the internal MVP:
- Astro front-end + server endpoints
- OpenAI Assistant/Responses integration (server-side)
- NanoBanana image generation integration (server-side)
- Local run + Cloudflare Tunnel sharing

This spec prioritizes: reproducibility, low latency, low complexity, and clean upgrade paths (auth/billing later).

---

## 2) Runtime & Language
### Baseline
- **Node.js**: LTS (recommend latest active LTS)
- **Package manager**: pnpm (fast, deterministic) or npm (fine)
- **Language**: TypeScript (strict mode) for API contracts + reliability

### Rationale
- TypeScript + schema validation prevents brittle prompt parsing and keeps API payloads stable.

---

## 3) Frontend
### Framework
- **Astro** (SSR enabled)
- Minimal client-side JS; use islands only where needed (stepper UI)

### UI Layer (MVP)
Choose one:
- **Tailwind CSS** (fast iteration)
- Or plain CSS modules (lowest dependencies)

### Stepper UX
- Server-driven pages with form posts OR a small client island for step transitions.
- Accessibility: keyboard nav, focus management, form validation.

---

## 4) Backend (within Astro)
### Astro Server Endpoints
Implement server routes that:
- Keep OpenAI and NanoBanana keys server-side
- Store session state
- Return only what UI needs (question text, progress, image payload)

Recommended endpoints:
- `GET  /api/templates`
- `POST /api/session/start`
- `POST /api/session/answer`
- `POST /api/generate`

### Request/Response Validation
- **zod** for runtime schema validation
- Define shared types for:
  - Session state
  - Stepper question/answer payloads
  - Final nanoBanana prompt payload (server-only)

---

## 5) OpenAI Integration
### Recommended SDK
- **OpenAI official Node SDK**

### API Choice
MVP options:
- **Assistants API** (fastest to mirror Custom GPT workflow)
- **Responses API** (recommended for longevity)

MVP recommendation:
- Start with Assistants if it’s already familiar, but structure code so the “LLM provider” is an adapter you can swap to Responses.

### Output Contract
- LLM returns **strict JSON**:
  - `{ "nanobanana_prompt": "..." }`
- Backend parses JSON and never exposes prompt to client.

### Cost / Latency Controls
- Max turns: fixed 3 questions
- Token caps
- Retry once on parse failure (with “JSON only” reminder)

---

## 6) NanoBanana Integration
### API Client
- Simple HTTP client via `fetch` (native) or `undici`

### Image Handling
Depending on NanoBanana response:
- If URL: render directly (consider proxying later)
- If base64/blob: stream/store temporarily and serve from an internal endpoint

### Timeouts / Retries
- Timeout on generation
- Retry policy: limited; surface clear error to UI

---

## 7) Session State (MVP)
### Storage
- **In-memory store** keyed by signed session cookie (acceptable for local/internal MVP)

Session data:
- templateId
- initialInput
- answers: [a1,a2,a3]
- createdAt
- lastUpdatedAt
- optional: lastImageRef

### Upgrade Path
- Replace store with KV/DB later (Cloudflare KV / Redis / Postgres)
- Add userId when auth arrives

---

## 8) Secrets & Config
- `.env` for local:
  - `OPENAI_API_KEY`
  - `NANOBANANA_API_KEY`
  - `SESSION_SECRET`
  - `NANOBANANA_API_URL`
- Never expose keys to client.

---

## 9) Observability (MVP)
- Structured server logs (JSON)
- Log:
  - OpenAI call latency + status
  - NanoBanana call latency + status
  - Stepper completion rate
- Optional: simple request IDs

---

## 10) Local Sharing
- **Cloudflare Tunnel** to share local app with partner
- Basic access control (optional): a simple shared secret header or single password page (even for internal MVP)

---

## 11) Dev Tooling
- ESLint + TypeScript strict
- Prettier
- Git hooks (optional): lint-staged
- Testing (optional MVP):
  - Unit tests for schema validation + prompt JSON parsing

---

## 12) Out of Scope (MVP)
- Auth, billing, quotas
- Persistent galleries
- Advanced content guardrails
- Multi-template management UI

---

## 13) Open Questions
(To be answered to finalize stack decisions)
- NanoBanana API returns URL vs base64? sync vs async?
- Will you deploy later to Cloudflare Pages/Workers, Vercel, etc.?
- Do you want a minimal password gate on the tunnel?

