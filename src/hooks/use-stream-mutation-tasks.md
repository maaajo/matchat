## TODO: Streaming hook for OpenAI Responses API (via wretch + React Query)

- 1. [x] Install dependency
  - 1.1. [x] Run: `npm install wretch`

- 2. [x] Define client payload types (mirror server `chatInputSchema`)
  - 2.1. [x] Confirm shape from `src/app/api/chat-openai/schema.ts`
  - 2.2. [x] Create `ChatOpenAIClientInput` type (or re-export `ChatInput`)
  - 2.3. [x] Include `previous_response_id?: string` and optional
    `model?: string`

- 3. [x] Add simple NDJSON parser utility
  - 3.1. [x] Create `src/lib/stream-parser.ts`
  - 3.2. [x] Set up OpenAI SDK types for proper typing
    - 3.2.1. [x] Import Response API event types from
      'openai/resources/responses/responses'
    - 3.2.2. [x] Use `ResponseStreamEvent` as base type for all events
    - 3.2.3. [x] Use `ResponseTextDeltaEvent` for delta text events
    - 3.2.4. [x] Use `ResponseCreatedEvent` for response creation events
    - 3.2.5. [x] Use `ResponseCompletedEvent` for response completion events
  - 3.3. [x] Simple NDJSON parsing (IMPORTANT: NDJSON = each line is ALWAYS a
    complete JSON object, never partial)
    - 3.3.1. [x] Split stream chunks by newlines, each line is complete JSON
    - 3.3.2. [x] Parse each line as JSON (NDJSON guarantees complete lines, no
      buffering needed)
    - 3.3.3. [x] Extract `type` field and handle different event types:
      - `response.output_text.delta` → extract `delta` field
      - `response.created` → extract `response.id` field
      - `response.completed` → mark stream as done
    - 3.3.4. [x] Accumulate delta text and capture response.id from events
  - 3.4. [x] Expose typed parser API
    - 3.4.1. [x] `parseNDJSONStream(reader, onEvent)` function (simplified: no
      line buffering since NDJSON = complete lines)
    - 3.4.2. [x] Call `onEvent(event: ResponseStreamEvent)` for each parsed
      event
    - 3.4.3. [x] Type guard helpers: `isOutputTextDelta(event)`,
      `isResponseCreated(event)`, `isResponseCompleted(event)`

- 4. [x] Implement hook file
  - 4.1. [x] Create `src/hooks/use-stream-mutation.ts`
  - 4.2. [x] Export `useStreamMutation` (client hook)
  - 4.3. [x] Return API: `{ ...mutation, text, abort, getLastResponseId }`
    (derive flags/final text in consumer)
  - 4.4. [x] Use `useMutation` for lifecycle and return only `{ responseId? }`
  - 4.5. [x] Create and store `AbortController` in a ref
  - 4.6. [x] Start request via `wretch('/api/chat-openai')`
    - 4.6.1. [x] No explicit headers required; server streams NDJSON
    - 4.6.2. [x] `.post(payload)`
    - 4.6.3. [ ] Optional: `.options({ credentials: 'include' })` if cookies
      needed
    - 4.6.4. [x] `.signal(controller.signal)`
    - 4.6.5. [x] `.res()` then parse `response.body` with NDJSON parser
  - 4.7. [x] Read `response.body.getReader()` and feed into `parseNDJSONStream`
  - 4.8. [x] Handle `response.output_text.delta` and `response.created`;
    accumulate and update `text`
  - 4.9. [x] Resolve with `{ responseId, text }`; cleanup controller
  - 4.10. [x] Non-2xx: attempt `response.json()` to extract message; throw
    `Error(message)`

- 5. [x] Support `previous_response_id`
  - 5.1. [x] Forward in payload
  - 5.2. [x] Do not mirror in state; expose `getLastResponseId()` for
    continuation

- 6. [x] Abort handling
  - 6.1. [x] Implement `abort()` that cancels the inflight request
  - 6.2. [x] Abort stops fetch/stream; `isStreaming` derived in UI from
    `mutation.isPending && text.length > 0`

- 7. [x] Edge cases
  - 7.1. [x] Parse error → throw; surfaces via `mutation.error`
  - 7.2. [x] Stream ends without explicit done → keep accumulated `text` in
    state
  - 7.3. [x] Ignore non-text/tool events; only handle text deltas and created

- 8. [ ] Tests (Vitest)
  - 8.1. [ ] NDJSON parser unit tests: JSON parsing, event type extraction, type
    guards
  - 8.2. [ ] Hook tests: mock wretch `.res()` with a `ReadableStream`
    - 8.2.1. [ ] Asserts: `text` grows while pending; upon success final text is
      in hook state; `isPending` toggles correctly
    - 8.2.2. [ ] Error: non-2xx JSON error surfaces via `mutation.error`;
      malformed frame throws; network error
    - 8.2.3. [ ] Abort mid-stream: `abort()` stops updates; no further `text`
      changes after abort
    - 8.2.4. [ ] `responseId` captured: `mutation.data.responseId` (and
      `getLastResponseId()`) reflects created event

- 9. [x] Docs
  - 9.1. [x] JSDoc for `useStreamMutation`
  - 9.2. [x] Usage snippet: returns
    `{ ...mutation, text, abort, getLastResponseId }`; derive
    `isStreaming`/`isGeneratingText` from `mutation.isPending` and
    `text.length`; final text is from `text` state
  - 9.3. [x] Continuation example: pass
    `previous_response_id: mutation.data?.responseId` or `getLastResponseId()`

- 10. [ ] Acceptance
  - 10.1. [ ] Streaming visible via `text` with no debounce
  - 10.2. [ ] On success, final text is available via `text` state
  - 10.3. [ ] `previous_response_id` supported in payload; `responseId`
    available via `mutation.data.responseId`
  - 10.4. [ ] Same-origin cookies respected if enabled; no token usage surfaced
  - 10.5. [ ] No changes to `src/modules/chat/ui/views/chat-view.tsx`
