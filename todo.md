- [x] Enter should send a message
- [x] Show tooltip that SHIFT + Enter starts new line
- [x] Disable send button when no text
- [x] Disable also when no text to send with Enter
- [x] Show toast when trying to enter and no message
- [x] Add tooltip with denied cursor when no message saying missing message
- [x] Check if it's possible to not render on each keystroke because of the
      message useWatch
- [x] Add tooltip to button when message is required
- [x] Add tooltip to button to send message
- [x] When message was send we should render pause with rectangle icon to pause
      it
- [x] Add tooltip for cancel generation
- [x] When aborted partial text is cleared
- [x] When aborted always render at the bottom red alert saying aborted by the
      user
- [x] When aborted we should not send the previous response id but have the one
      that succeeded?
      {{"errorCode":400,"errorMessage":"Previous response with id 'resp_68bfe4292dc081939d6b03fbf7705bf7006fffc95e9d1bc2' not found.","status":"error","timestamp":"2025-09-09T08:26:05.127Z"}}
- [x] The chat container should be scrollable area
- [x] Use use-stick-to-bottom for smooth scrolling when loading
- [x] Add scroll button in the chat container being rendered
- [x] StickToBottom should be used in ChatContainer
- [x] Stick to bottom button should be it's onw component imported and looking
      differently
- [x] The scrollable area should be the entire page
- [x] The messages should appear as they are rendered behind the Section with
      TextArea
- [x] Fix the positioning of the scroll to bottom button
- [x] Fix the positioning of the welcome message
- [x] Add trpc
- [x] Add chat schema to db
- [ ] Generate Chat title
- [ ] When new chat starts we should assign new id and change route
- [ ] Save chat to db with trpc
- [ ] Add model name to the chat message
- [ ] Add date to chat message?
- [ ] Add start new chat
- [ ] Make the button whn stream is generating pulsating
- [ ] Add sidebar
- [ ] Add prompt library
- [ ] Add db for chat, messages
- [ ] Add sidebar with past chats
- [ ] Add model change
- [ ] Add chat message actions
- [ ] Add pdf and image attachments
- [ ] Maybe all the default/fallback message should be an object?

### Chat creation and redirect flow (detailed)

Context and constraints

- Title generation happens inside the TRPC `chat.create` mutation (imports
  shared helper). The OpenAI streaming API route is title-agnostic.
- On first submit, after DB insert succeeds, update the URL using
  `window.history.replaceState({}, '', '/chat/{id}')` (no navigation, no
  remount, no flicker), then start streaming from the mounted component.
- No query parameters and no `sessionStorage` are used.
- All client TRPC calls use React Query hooks. `chat.create` accepts
  `{ input: string }` and derives `title` server-side.

Architecture overview

- `/chat`: New conversation composer page. First submit performs: validate →
  `chat.create({ input })` (server generates title) →
  `window.history.replaceState({}, '', '/chat/{id}')` → start streaming via
  `useStreamMutation` with `{ input }`.
- `/chat/[chatId]`: Used for deep links and refreshes. When landing directly,
  the page SSRs with auth guard and the user starts streaming by sending a
  message.

Server utilities

- [ ] Extract shared title helper `src/modules/chat/lib/ai/title.ts`
  - Implement `generateChatTitle(input: string): Promise<string>` using OpenAI
    and the existing `generateChatTitlePrompt`.
  - Use `zod` to parse/validate the LLM output. Derive the return type from the
    schema (`z.infer`).
  - Ensure the helper is server-only (no client imports). Handle errors with
    meaningful messages.
  - Consider a max-length cap and basic normalization (trim, collapse
    whitespace).
  - Add unit tests for typical, long, empty/invalid inputs.

TRPC API

- [ ] Update `chatCreateSchema` to `{ input: string }` and derive title inside
      mutation
  - Validate minimum length and trim on input.
  - Title is generated server-side using the shared helper.
  - Insert into `db.chat` using `ctx.auth.user.id` and return
    `{ id, title, createdAt }`.
  - Tests: happy path, validation error, unauthorized, OpenAI failure, DB error.

OpenAI streaming route cleanup

- [ ] Refactor `src/app/api/chat-openai/route.ts`
  - Remove any title-generation logic from this route. It should only handle
    streaming.
  - Ensure existing NDJSON contract remains unchanged (see
    `src/lib/stream-parser.ts`).
  - Update/verify existing tests still pass.

Routing

- [ ] Add `src/app/chat/[chatId]/page.tsx`
  - SSR with the same auth guard pattern as `src/app/chat/page.tsx`.
  - Render `ChatView` with `chatId={params.chatId}` and user name.

Client: streaming

- [ ] Start streaming from `ChatView` after `replaceState`, using existing
      `useStreamMutation`.
  - Abort/stop control is shown only when `useStreamMutation` indicates the
    stream is active.

Client: `ChatView` behavior

- [ ] First submit flow on `/chat` (no `chatId` prop)
  - Validate with existing `chatMessageSchema`.
  - Call `api.chat.create.useMutation({ input })`.
  - On success: `window.history.replaceState({}, '', '/chat/{id}')`, then
    immediately start `useStreamMutation` with `{ input }`.
  - While create is pending, disable the submit button and show loading states.
  - Abort/stop control is hidden until streaming becomes active.
- [ ] Submit flow on `/chat/[chatId]`
  - For direct visits, no auto-start; user types and starts streaming via the
    same `useStreamMutation`.
  - Abort/stop control is visible only during active streaming.
- [ ] UI states and controls
  - Disable submit if: form invalid OR create pending OR stream pending (avoid
    double-requests).
  - Tooltip text should reflect why the button is disabled.
  - Abort button visible/enabled only during active stream.

Error handling

- [ ] On TRPC errors (create): show toast, keep form value, do not modify URL,
      re-enable submit.
- [ ] On streaming errors: preserve partial text, show error message, allow
      retry.

Tests

- [ ] Unit tests
  - `generateChatTitle` helper: normalizes long/short inputs, handles parse
    errors.
  - TRPC `chat.create`: validation, auth, and error scenarios.
- [ ] Integration/React tests
  - On `/chat`, first submit triggers `chat.create`, then calls
    `window.history.replaceState`, then starts `useStreamMutation`.
  - Abort button is hidden/disabled during create; visible during stream only.
  - Back button should not take the user back to `/chat` (we used replace).
  - No query parameters are added; no `sessionStorage` is used.
- [ ] API route tests
  - NDJSON contract remains stable; title generation is not invoked from the
    route.

Acceptance criteria

- URL updates to `/chat/{id}` with `window.history.replaceState` (no remount).
- Streaming starts immediately after replaceState and proceeds without flicker.
- Abort control is only available during active streaming.
- Title generation is centralized in TRPC and reusable via a shared helper.
- Existing streaming functionality and NDJSON contract remain unchanged.
