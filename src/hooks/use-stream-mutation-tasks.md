## TODO: Streaming hook for OpenAI Responses API (via wretch + React Query)

- 1. [x] Install dependency
  - 1.1. [x] Run: `npm install wretch`

- 2. [x] Define client payload types (mirror server `chatInputSchema`)
  - 2.1. [x] Confirm shape from `src/app/api/chat-openai/schema.ts`
  - 2.2. [x] Create `ChatOpenAIClientInput` type (or re-export `ChatInput`)
  - 2.3. [x] Include `previous_response_id?: string` and optional
    `model?: string`

- 3. [ ] Add simple NDJSON parser utility
  - 3.1. [x] Create `src/lib/stream-parser.ts`
  - 3.2. [x] Set up OpenAI SDK types for proper typing
    - 3.2.1. [x] Import Response API event types from
      'openai/resources/responses/responses'
    - 3.2.2. [x] Use `ResponseStreamEvent` as base type for all events
    - 3.2.3. [x] Use `ResponseTextDeltaEvent` for delta text events
    - 3.2.4. [x] Use `ResponseCreatedEvent` for response creation events
    - 3.2.5. [x] Use `ResponseCompletedEvent` for response completion events
  - 3.3. [ ] Simple NDJSON parsing (IMPORTANT: NDJSON = each line is ALWAYS a
    complete JSON object, never partial)
    - 3.3.1. [x] Split stream chunks by newlines, each line is complete JSON
    - 3.3.2. [ ] Parse each line as JSON (NDJSON guarantees complete lines, no
      buffering needed)
    - 3.3.3. [ ] Extract `type` field and handle different event types:
      - `response.output_text.delta` → extract `delta` field
      - `response.created` → extract `response.id` field
      - `response.completed` → mark stream as done
    - 3.3.4. [ ] Accumulate delta text and capture response.id from events
  - 3.4. [ ] Expose typed parser API
    - 3.4.1. [ ] `parseNDJSONStream(reader, onEvent)` function (simplified: no
      line buffering since NDJSON = complete lines)
    - 3.4.2. [ ] Call `onEvent(event: ResponseStreamEvent)` for each parsed
      event
    - 3.4.3. [ ] Type guard helpers: `isOutputTextDelta(event)`,
      `isResponseCreated(event)`, `isResponseCompleted(event)`

- 4. [ ] Implement hook file
  - 4.1. [ ] Create `src/hooks/use-stream-mutation.ts`
  - 4.2. [ ] Export `useStreamMutation` (client hook)
  - 4.3. [ ] Return API:
    `{ mutate, mutateAsync, isPending, isStreaming, streamedText, finalText, responseId?, previousResponseId?, error, abort }`
  - 4.4. [ ] Use `useMutation` for lifecycle
  - 4.5. [ ] Create and store `AbortController` in a ref
  - 4.6. [ ] Start request via `wretch('/api/chat-openai')`
    - 4.6.1. [ ] Headers: `Content-Type: application/json`,
      `Accept: application/x-ndjson`
    - 4.6.2. [ ] `.post(payload)`
    - 4.6.3. [ ] `.options({ credentials: 'include' })`
    - 4.6.4. [ ] `.signal(controller.signal)`
    - 4.6.5. [ ] `.res(async (res) => { /* stream parse */ })`
  - 4.7. [ ] Read `res.body.getReader()` + `TextDecoder('utf-8')`
  - 4.8. [ ] Pipe chunks to NDJSON parser with typed event handling and update
    state
  - 4.9. [ ] Resolve on done/end; cleanup reader/controller
  - 4.10. [ ] Non-2xx: parse server JSON to `ApiErrorResponse` if possible; set
    `error`

- 5. [ ] Support `previous_response_id`
  - 5.1. [ ] Forward in payload
  - 5.2. [ ] Reflect into `previousResponseId` state

- 6. [ ] Abort handling
  - 6.1. [ ] Implement `abort()` that cancels the inflight request
  - 6.2. [ ] Stop streaming loop and set `isStreaming` false on abort

- 7. [ ] Edge cases
  - 7.1. [ ] Malformed JSON line → stop stream, set `error`
  - 7.2. [ ] Stream ends without explicit done → set `finalText = streamedText`
  - 7.3. [ ] Ignore tool-call events (text-only scope)

- 8. [ ] Tests (Vitest)
  - 8.1. [ ] NDJSON parser unit tests: JSON parsing, event type extraction, type
    guards
  - 8.2. [ ] Hook tests: mock wretch `.res()` with a `ReadableStream`
    - 8.2.1. [ ] Asserts: `streamedText` grows, `finalText` set, `isStreaming`
      toggles
    - 8.2.2. [ ] Error: non-2xx JSON error; malformed frame; network error
    - 8.2.3. [ ] Abort mid-stream behavior

- 9. [ ] Docs
  - 9.1. [ ] JSDoc for `useStreamMutation`
  - 9.2. [ ] Usage snippet: payload (string or messages array), start streaming,
    abort

- 10. [ ] Acceptance
  - 10.1. [ ] Streaming visible via `streamedText` with no debounce
  - 10.2. [ ] `finalText` set on completion
  - 10.3. [ ] `previous_response_id` supported
  - 10.4. [ ] Same-origin cookies respected; no token usage surfaced
  - 10.5. [ ] No changes to `src/modules/chat/ui/views/chat-view.tsx`
