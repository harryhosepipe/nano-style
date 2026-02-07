# MVP Flow State Machine

## Purpose
Define the canonical MVP flow and state transitions for:
- template selection
- initial user input
- fixed 3-question refinement
- generation
- post-result iteration

This document is the source of truth for frontend state behavior and backend endpoint sequencing.

## Fixed Questions (Canonical)
Question order is fixed and non-adaptive in MVP:
1. Subject + usage context: `What are we generating (product/lifestyle) and what’s the moment? (subject + action + setting)`
2. Lighting direction: `What’s the lighting scenario? (golden hour backlight / soft window light / controlled side light / practicals)`
3. Brand vibe + guardrails: `Give 3–5 vibe words + any must-haves (colors/props/text/no-text) to keep it authentic.`

## Sparse-Answer Behavior (Canonical)
- Empty/too-short answer rule:
  - Re-ask the same question once.
  - If still sparse, continue to the next question with server-side tasteful defaults.
- Question cap:
  - Always capped at 3 questions.
  - No additional follow-up questions in MVP.

## Session Model (Behavioral)
- Session starts after initial input submission.
- Session tracks:
  - `templateId`
  - `initialInput`
  - `answers[3]` (nullable until answered/defaulted)
  - `questionIndex` (1-based)
  - `status`
- Status values:
  - `template_selected`
  - `initial_input_collected`
  - `refinement_q1`
  - `refinement_q2`
  - `refinement_q3`
  - `ready_to_generate`
  - `generating`
  - `result_ready`
  - `error`

## Canonical State Transitions
| Current State | User Action | Endpoint | Next State | Notes |
| --- | --- | --- | --- | --- |
| `template_selected` | Submit initial input | `POST /api/session/start` | `refinement_q1` | Creates/starts session and returns Q1 text |
| `refinement_q1` | Submit answer | `POST /api/session/answer` | `refinement_q2` | Re-ask once first if sparse |
| `refinement_q2` | Submit answer | `POST /api/session/answer` | `refinement_q3` | Re-ask once first if sparse |
| `refinement_q3` | Submit answer | `POST /api/session/answer` | `ready_to_generate` | Re-ask once first if sparse |
| `ready_to_generate` | Generate | `POST /api/generate` | `generating` | Server synthesizes prompt and calls NanoBanana |
| `generating` | Provider success | internal async completion | `result_ready` | Return/display image result |
| `generating` | Provider failure | internal async completion | `error` | Show actionable safe message |
| `error` | Retry generate | `POST /api/generate` | `generating` | Reuses current session answers |

## Iteration Paths (Result Screen)
| Action | Endpoint | Backend Mutation | Next State |
| --- | --- | --- | --- |
| `Generate another` | `POST /api/generate` | Keep same `templateId` + `initialInput` + `answers`; new generation request | `generating` |
| `Change answers` | `POST /api/session/answer` (edit mode) | Update one or more answers; keep same session | `refinement_q1` / `refinement_q2` / `refinement_q3` (depending on edit point), then `ready_to_generate` |
| `Start over` | `POST /api/session/start` (new session) | Reset session state from scratch; preserve nothing except available templates | `refinement_q1` |

## Endpoint Response Expectations
- `POST /api/session/start`
  - Returns: `sessionId`, `questionIndex: 1`, `questionText`
- `POST /api/session/answer`
  - Returns:
    - next question: `questionIndex`, `questionText`, or
    - done marker: `done: true` (ready to generate)
- `POST /api/generate`
  - Returns image reference payload on success
  - Returns stable error envelope on failure

## UX Constraints
- One question visible at a time.
- Progress indicator uses canonical count: `Question N of 3`.
- Final synthesized NanoBanana prompt is never shown to user.
