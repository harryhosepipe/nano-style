# NanoBanana Prompt Refinery — PRD (MVP v0.1)
## 1) Summary
A lightweight internal MVP web app that mirrors an existing “custom GPT” workflow for producing NanoBanana-ready image prompts.
User experience is intentionally minimal:
- User selects a **pre-configured prompt template** (represents your existing custom GPT’s “mode” / instruction set).
- User provides **one piece of input** (a single constraint field) and then answers **up to ~3 follow-up questions** (one at a time).
- The system uses the OpenAI Assistants API (or Responses API equivalent) to refine the user’s info into a final NanoBanana prompt.
- The final prompt is **never shown** to the user in MVP.
- The app calls NanoBanana API and renders the resulting image.
MVP is for internal testing only (local dev + Cloudflare Tunnel to a partner). No auth, no payments, no rate limits, no seed/negative prompts.
## 2) Goals and Non-Goals
### Goals (MVP)
- Replicate the existing custom GPT workflow via API with minimal UX.
- Template-first flow: users choose a pre-configured prompt template, then provide minimal info.
- Stepper UX: one question at a time (fast, low cognitive load).
- Generate NanoBanana images reliably end-to-end.
- Keep architecture clean enough to add accounts/credits later without rewriting core flow.
### Non-Goals (MVP)
- User accounts, payments, credits.
- Seeds, negative prompts, advanced controls.
- Prompt visibility/editing (user does not see the final prompt).
- Content warnings/advanced guardrails beyond basic API safety responses.
## 3) Target Users
- Internal testers (you + partner).
- Eventually: creators/brands who want high-quality images without prompt engineering.
- Creators/designers who want better image generations without prompt expertise.
- Marketers generating concept images quickly.
- Hobbyists experimenting with style and scenes.
## 4) Core User Journey (MVP)
### Primary Flow (General Cinematic → 3-step refinement → Image)
1. **Template selection**
   - Only one template in MVP: **General Cinematic**.
2. **Single constraint input (User Input A)**
   - One field (MVP): **“Describe what you want to generate”**
   - Placeholder: “e.g., ‘Hero image for a streetwear brand: model in rainy neon city’”
3. **Refinement stepper (fixed questions, one at a time)**
   - Q1: Subject + deliverable
   - Q2: Brand / vibe
   - Q3: Must-haves / must-avoid
4. **Synthesis (hidden)**
   - System synthesizes a NanoBanana prompt from (template + inputs).
   - The user never sees the prompt.
5. **Generate image**
   - Call NanoBanana API.
   - Render the resulting image.
6. **Iterate**
   - “Generate another”
   - “Change answers”
   - “Start over”
### MVP Success Criteria
- From template select → image display in under ~60–90 seconds on average.
- ≥ 90% of attempts complete without manual intervention (for internal test).
- Consistent, repeatable image quality comparable to your custom GPT workflow.
## 5) Functional Requirements
### 5.1 Prompt Refinement
- FR-PR-01: Display a list of pre-configured templates.
- FR-PR-02: Accept one initial user constraint input (single field).
- FR-PR-03: Call OpenAI Assistants API to generate the **next question** based on (template + known answers).
- FR-PR-04: Stepper UX: one question at a time; store answers per step.
- FR-PR-05: Cap refinement steps at **3** for MVP (configurable constant).
- FR-PR-06: After final step (or early stop), synthesize a NanoBanana prompt **server-side**.
- FR-PR-07: Do not display the synthesized prompt to the user (MVP).
- FR-PR-08: Persist only per-session state (no accounts).
### 5.2 NanoBanana Image Generation
- FR-NB-01: Send final prompt payload to NanoBanana API.
- FR-NB-02: Handle async/polling/webhook (depending on NanoBanana API).
- FR-NB-03: Render image result.
- FR-NB-04: Handle failures gracefully with actionable messages.
### 5.3 UI/UX
- FR-UX-01: Stepper-based refinement UX (one question at a time).
- FR-UX-02: Minimal screens:
  - Template selection
  - Initial input
  - Stepper Q1–Q3
  - Generating…
  - Result screen with image + actions
- FR-UX-03: Clear progress indicator (e.g., “Question 2 of 3”).
- FR-UX-04: No prompt display in MVP.
- FR-UX-05: “Start over / switch template” always available.
### 5.4 Observability (Lightweight but essential) (Lightweight but essential)
- FR-OBS-01: Log requests to OpenAI and NanoBanana (no PII; redact prompt if needed).
- FR-OBS-02: Capture latency, error rates, completion rates.
## 6) Non-Functional Requirements
- Performance: page loads < 1s on fast connection; avoid heavy client JS.
- Reliability: retries with backoff; idempotency where possible.
- Security: API keys never exposed to client; server-side proxy endpoints.
- Privacy: clarify what user inputs are sent to OpenAI/NanoBanana.
## 7) System Architecture (MVP)
### Deployment
- Local development environment.
- Shared to partner via **Cloudflare Tunnel**.
### Front-end
- Astro pages + minimal islands.
- Prefer server-rendered steps; keep client JS light (only for step transitions and form submission).
### Backend (within Astro)
Server routes/endpoints (MVP proposal):
- `GET  /api/templates` → returns `[ { id, name, description } ]`
- `POST /api/session/start` → `{ templateId, initial }` → `{ sessionId, questionIndex: 1, questionText }`
- `POST /api/session/answer` → `{ sessionId, answer }` → `{ questionIndex, questionText }` OR `{ done: true }`
- `POST /api/generate` → `{ sessionId }` → `{ image }`
Notes:
- `/api/generate` should call OpenAI to synthesize the final prompt (server-only), then call NanoBanana.
- If you want fewer endpoints, you can merge `answer` and `generate` by auto-generating after Q3.
### State
- MVP: session state stored server-side (in-memory store is fine for local) keyed by a signed session id cookie.
- State model should be compatible with future persistence (KV/DB) and user accounts.
### Security
- OpenAI and NanoBanana API keys remain server-side.
- Endpoints validate session ids and basic payload shape.
## 8) OpenAI Assistants / Responses Contract
### Reality check (important)
- You do **not** get an “API key from an assistant.” You create an assistant (or prompt) and then call it using your **project API key** from your OpenAI dashboard. )
- The Assistants API is deprecated and scheduled to shut down on **August 26, 2026**. For an MVP you can still use it, but the PRD should be future-proofed toward the **Responses API** migration path. )
### MVP approach
Because you already have a working “custom GPT” instruction set, MVP should:
- Create **one** assistant (or one prompt object if using Responses API) called **General Cinematic**.
- Put your instruction set into that assistant’s `instructions`.
- Use a simple, fixed 3-question stepper; no adaptive branching in MVP.
### Template (MVP)
**Template ID:** `general-cinematic`
- `name`: General Cinematic
- `instructions`: “Nano Banana Prompt Engineer” instruction set (ported from the Custom GPT), grounded in:
  - **Cinematic but grounded** realism and authenticity
  - **Lighting-first** (single clear light source; soft, directional)
  - Layered depth + intentional negative space + asymmetrical balance
  - Color discipline: cohesive palette, no competing color stories
  - “Director/engineer” mindset: define semantic blueprint before rendering
**Knowledge base sources (MVP):**
- `nano_banana_gpt_knowledge_base (1).md`
- `Gavin's Taste Principles (1).md`
Implementation note:
- For MVP, you can start with the instruction text embedded directly in the assistant’s `instructions` field.
- If you want the assistant to “reference” the knowledge base dynamically, wire these docs into an assistant vector store / file search tool later.
### Fixed questions (MVP)
The assistant asks these **exactly**, in order (aligned to your priority stack):
1) **Subject + usage context:** “What are we generating (product/lifestyle) and what’s the moment? (subject + action + setting)”
2) **Lighting direction:** “What’s the lighting scenario? (golden hour backlight / soft window light / controlled side light / practicals)”
3) **Brand vibe + guardrails:** “Give 3–5 vibe words + any must-haves (colors/props/text/no-text) to keep it authentic.”
(If the user answers are sparse, proceed with tasteful defaults rather than asking extra questions.)
### Output (server-only)
- `final_nanobanana_prompt`: **string**
  - No negative prompt, no seed.
  - Must be a single NanoBanana-ready prompt string.
  - Must include any implicit “cinematic” defaults required by the template.
### Implementation patterns
#### Option A: Assistants API (fastest to mirror a custom GPT)
- Create assistant: `client.beta.assistants.create({ name, model, instructions })`. )
- For each user session:
  - Create thread
  - Add messages (initial input + answers)
  - Create run
  - Read messages for assistant output. )
#### Option B: Responses API (recommended for longevity)
- Use the migration guide approach (assistant → prompt object) and call Responses with the prompt + conversation items. )
### Guardrails (MVP-light)
- Hard cap: 3 questions only.
- Max output length for `final_nanobanana_prompt` (e.g., 800–1200 chars) to avoid rambling.
- If user answers are empty/too short, re-ask the same question once (then proceed with defaults).
## 9) Error Handling
- OpenAI failures: show “We couldn’t refine right now—try again” + retry.
- NanoBanana failures: show reason if safe; allow regenerate.
- Validation errors: highlight missing fields.
## 10) Analytics (MVP)
Track:
- Funnel: start → refinement started → synthesis → generation request → image success.
- Avg time to image.
- # of refinement questions asked.
- Manual prompt edits frequency.
## 11) Risks and Mitigations
- Prompt quality inconsistent → enforce schema, add guardrails, add examples.
- Latency too high → minimize steps, stream assistant responses if possible.
- Cost overruns → cap tokens, cap # turns, cache repeated operations.
## 12) Future Expansion (post-MVP)
- Auth + payments + credit system.
- Rate limits and abuse prevention.
- Optional prompt visibility + editing.
- More templates and richer constraints (aspect ratio, style presets).
- Content warnings and policy-driven messaging.
- Gallery/history, sharing.
## 13) Open Questions (to finalize)
- NanoBanana API specifics: request/response, async model, image format/hosting.
- Where to store generated images (NanoBanana-hosted URL vs your own storage).
- Best way to port “custom GPT instructions” into an Assistant (single assistant per template vs one assistant with template-conditioned system content).
- Whether the refinement can end early (assistant says it has enough info before 3 questions).
- NanoBanana API details: prompt fields, negative prompts, seeds, aspect ratios, async model.
- UX choice: stepper vs chat.
- Session persistence strategy.
- Guardrails and content policy.

