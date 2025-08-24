> Sequential plan. Implement **v1** first, then **v2**, then optionally **v3**.
> Backend-only; the **frontend will consume** the endpoint. No frontend tasks
> here. v1 uses the **official OpenAI SDK** only (no provider-agnostic layer in
> v1).

---

## Overview

- **Goal:** Expose a Next.js App Router API endpoint that proxies to **OpenAI**
  and **streams** tokens for a chat UI.
- **Stack:** Next.js 15 (App Router), TypeScript, Zod (request validation only),
  Vitest (tests).
- **Auth:** **better-auth**.
- **Runtime:** Not fixed; **Node** recommended for SDK streaming compatibility.
- **Out of scope (v1):** Frontend, server-side conversation storage,
  provider-agnostic abstraction.

---

## v1 — Authenticated OpenAI Route (MVP)

### Purpose

Deliver a minimal, reliable backend for streaming chat for authenticated users.
Keep implementation simple and production-sane.

### Scope (In)

- **Route:** `/api/chat-openai`
- **Method:** `POST`
- **Auth:** **better-auth** enforced **server-side inside the route**
  - On failure: return **401** with JSON, e.g.
    `{ "code": "unauthorized", "message": "Sign in required." }`
- **Provider:** **OpenAI** only (official OpenAI SDK)
- **API family:** Prefer **Responses API** (fallback to Chat Completions via
  internal toggle only if truly needed)
- **Validation:** **Zod** for **request payload only** (environment variables
  are validated elsewhere)
- **Streaming:** **SDK passthrough** (do **not** re-implement streaming)
- **Testing:** **Vitest** (schema validation + route behavior with SDK mocks)
- **Runtime:** Any; **Node** recommended for streaming reliability

### Server Contract — Request (validated with Zod)

- `messages`: array of
  `{ role: "user" | "assistant" | "system"; content: string }`
- `system`: optional string
- `model`: optional string (server default if omitted)
- `temperature`: optional number in `[0, 2]` (sensible default)
- `maxOutputTokens`: optional positive integer (optionally cap at an upper
  limit)
- `responseFormat`: `"text"` or
  `{ "type": "json_schema", "schema": object, "strict"?: boolean }` (optional)

### Input Size Clamps (enforced with Zod)

- **Max messages:** e.g., **30** (`.max(30)`)
- **Per-message content length:** e.g., **4,000 chars** (`.min(1).max(4000)`)
- **Total content length across all messages:** e.g., **40,000 chars** (use
  `superRefine` to sum `content.length` and fail if over)
- **Other bounds:** `temperature ∈ [0,2]`; `maxOutputTokens` positive
  (optionally upper-bounded)

### Server Contract — Response

- **Streaming tokens** to the client via **passthrough of the OpenAI SDK
  stream**
- **No custom event re-enveloping** in v1

### SSE Headers (set explicitly)

- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-store, no-transform`
- `Connection: keep-alive`
- **Disable compression** for this route (SSE + gzip can break buffering)

### Abort & Cleanup (server-side)

- **Propagate client cancel** to OpenAI:
  - Listen to the request’s **abort signal**
  - Pass that signal into the OpenAI SDK call
  - Abort/cancel the upstream request if the client disconnects
- Close the server stream promptly (free sockets/resources and stop token
  generation)

### Errors & Security

- **401** unauthenticated (as above)
- **400** validation failures (return Zod error details)
- **Upstream non-2xx:** return non-2xx JSON (no stream)
- **Mid-stream upstream error:** connection closes (passthrough behavior; log
  with request id)
- Never expose `OPENAI_API_KEY`

### Observability (minimal)

- Log request id, chosen model, duration
- Capture token usage if available after completion
- Do not log raw prompts/PII by default

### Acceptance Criteria (v1)

- Authenticated users can `POST /api/chat-openai` and receive a **live stream**
  of tokens
- Zod rejects oversize/invalid payloads with **400** and clear reasons
- Route sets the **SSE headers** above and does **not** compress
- Client cancellation **stops** the upstream OpenAI request and closes the
  server stream
- Tests cover: schema edges, happy stream path, upstream error path, client
  abort, and **401** path

---

## v2 — Rate Limiting with `rate-limiter-flexible` + Self-Hosted Redis

### Purpose

Protect `/api/chat-openai` against abuse while preserving normal usage for
authenticated users.

### Approach & Decisions

- **Library:** `rate-limiter-flexible`
- **Store:** **Redis** (self-hosted), safe across multiple instances
- **Keying:** **User id** (from better-auth); optionally combine with IP as
  secondary signal
- **Policies:** short-window burst control; optional daily quota; respond
  **429** with standard rate-limit headers where practical
- **Operational:** choose TTLs/points; allowlist admins/support; telemetry for
  rejections/top keys

### Contract Impact

- No breaking changes; **429** responses under load

### Testing (v2 additions)

- Mock Redis + limiter; assert allowed vs throttled requests and correct **429**
  semantics

### Acceptance Criteria (v2)

- Normal users operate without friction under typical usage
- Abusive/misconfigured clients receive consistent **429**s with appropriate
  headers
- Limits are enforceable across multiple instances

---

## v3 — Optional Provider Expansion / Normalized SSE

### Purpose

Add more providers without disturbing the v1 OpenAI route.

### Approach

- Add **sibling routes** (e.g., `/api/chat-gemini`) for provider-specific
  integrations
- **Only if needed**, add a thin **normalized SSE** layer for a unified
  cross-provider contract Keep `/api/chat-openai` as passthrough

### Acceptance Criteria (v3)

- New provider routes work independently of `/api/chat-openai`
- (If chosen) A unified route emits a stable SSE contract across providers
  without breaking existing clients

---

## Dependencies

- **Next.js 15** (App Router), **TypeScript**
- **Zod** (request validation; env validated elsewhere)
- **better-auth** (auth; user identity for future rate-limit keys)
- **OpenAI SDK** (single provider in v1)
- **Vitest** (unit/integration tests)
- **rate-limiter-flexible + Redis** (introduced in v2)

---

## Risks & Mitigations

- **Upstream API shape changes:** passthrough exposes provider event shapes →
  pin SDK versions; document assumptions
- **Streaming reliability:** prefer Node runtime; monitor timeouts and
  mid-stream errors
- **Rate-limit tuning (v2):** start conservative; use telemetry to adjust
  windows/quotas
- **Multi-provider complexity (v3):** defer abstraction until needed; isolate
  via sibling routes
