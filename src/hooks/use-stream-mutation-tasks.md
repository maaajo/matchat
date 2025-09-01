## TODO: Streaming hook for OpenAI Responses API (via wretch + React Query)

- 1. [x] Install dependency
  - 1.1. [x] Run: `npm install wretch`

- 2. [x] Define client payload types (mirror server `chatInputSchema`)
  - 2.1. [x] Confirm shape from `src/app/api/chat-openai/schema.ts`
  - 2.2. [x] Create `ChatOpenAIClientInput` type (or re-export `ChatInput`)
  - 2.3. [x] Include `previous_response_id?: string` and optional
    `model?: string`

- 3. [ ] Add Stream parser utility
  - 3.1. [x] Create `src/lib/stream-parser.ts`
  - 3.2. [ ] Parse NDJSON stream to match `route.ts` Response (OpenAI outputs
    NDJSON, not SSE)
    - 3.2.1. [x] Accumulate decoded text in a buffer; split frames on newline
      delimiters (`\n` or `\r\n`)
    - 3.2.2. [ ] For each line, parse as JSON:
      - 3.2.2.1. [ ] Skip empty lines
      - 3.2.2.2. [ ] Parse each line as JSON object directly
      - 3.2.2.3. [ ] Extract `type` field as event type (e.g.
        `response.output_text.delta`)
      - 3.2.2.4. [ ] Use entire JSON object as event data
    - 3.2.3. [ ] If the last chunk ends mid-line, retain tail in buffer for next
      read
  - 3.3. [ ] Use OpenAI Responses API event types for strong typing
    - 3.3.1. [ ] Import types (type-only): `ResponseStreamEvent`,
      `ResponseTextDeltaEvent`, `ResponseTextDoneEvent`
    - 3.3.2. [ ] Also handle output-text variants if present in SDK:
      `ResponseOutputTextDeltaEvent`, `ResponseOutputTextDoneEvent`
    - 3.3.3. [ ] Narrow parsed `unknown` payloads to these union types
  - 3.4. [ ] Map events to text accumulation
    - 3.4.1. [ ] Text delta (append): when `type === 'response.text.delta'`
      append `(event as ResponseTextDeltaEvent).delta` (fallback to `.value` if
      needed)
    - 3.4.2. [ ] Output text delta (append): when
      `type === 'response.output_text.delta'` append
      `(event as ResponseOutputTextDeltaEvent).delta`
    - 3.4.3. [ ] Text done (finalize): when `type === 'response.text.done'` mark
      text complete (no additional text payload)
    - 3.4.4. [ ] Output text done (finalize): when
      `type === 'response.output_text.done'` set
      `finalText = (event as ResponseOutputTextDoneEvent).text` if present,
      otherwise finalize from accumulated buffer
    - 3.4.5. [ ] Created/in-progress: on `response.created` /
      `response.in_progress` capture and store `response.id` (as `responseId`)
      when available
    - 3.4.6. [ ] Content/item events: ignore `response.output_item.added/done`
      and `response.content_part.added/done` (only process deltas/done for
      `output_text`)
    - 3.4.7. [ ] Terminal guard: on `response.completed` (or `response.done`),
      finish the stream and prevent further deltas from mutating state
    - 3.4.8. [ ] Ignore unrelated/non-text events (reasoning, tool_calls, etc.)
  - 3.5. [ ] Expose parser API
    - 3.5.1. [ ] `parseNDJSON(reader, onEvent)` that calls
      `onEvent(event: ResponseStreamEvent)` per parsed JSON line
    - 3.5.2. [ ] Extract event type from `event.type` field in JSON payload
    - 3.5.3. [ ] Optional type guards: `isTextDelta(e)`, `isTextDone(e)`
  - 3.6. [ ] Robustness
    - 3.6.1. [ ] Wrap `JSON.parse` per frame; surface parse errors to caller
    - 3.6.2. [ ] Handle CRLF vs LF newlines and multi-byte boundaries safely
    - 3.6.3. [ ] Stop cleanly when reader returns `{ done: true }`

- 4. [ ] Implement hook file
  - 4.1. [ ] Create `src/hooks/use-stream-mutation.ts`
  - 4.2. [ ] Export `useStreamMutation` (client hook)
  - 4.3. [ ] Return API:
    `{ mutate, mutateAsync, isPending, isStreaming, streamedText, finalText, responseId?, previousResponseId?, error, abort }`
  - 4.4. [ ] Use `useMutation` for lifecycle
  - 4.5. [ ] Create and store `AbortController` in a ref
  - 4.6. [ ] Start request via `wretch('/api/chat-openai')`
    - 4.6.1. [ ] Headers: `Content-Type: application/json`,
      `Accept: text/event-stream`
    - 4.6.2. [ ] `.post(payload)`
    - 4.6.3. [ ] `.options({ credentials: 'include' })`
    - 4.6.4. [ ] `.signal(controller.signal)`
    - 4.6.5. [ ] `.res(async (res) => { /* stream parse */ })`
  - 4.7. [ ] Read `res.body.getReader()` + `TextDecoder('utf-8')`
  - 4.8. [ ] Pipe chunks to NDJSON parser and update state on deltas/done
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
  - 8.1. [ ] `ndjson-parser` unit tests: chunk boundaries, partial lines,
    delta→done, ignore unrelated
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
