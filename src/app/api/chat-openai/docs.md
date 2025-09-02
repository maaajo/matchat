## OpenAI Chat API — Request/Response Contracts

### Endpoint

- **Method**: `POST`
- **Path**: `/api/chat-openai`
- **Auth**: Required (session via better-auth). Requests without a valid session
  return `401`.

### Request

- **Headers**:
  - `Content-Type: application/json`

- **Body (JSON)**:
  - `input` (required): string | array of message objects
    - If array, each item:
      - `type` (optional): must be the literal `"message"` when present
      - `role` (required): one of
        `"user" | "system" | "developer" | "assistant"`
      - `content` (required): non-empty string
  - `previous_response_id` (optional): string — used to continue a prior
    response thread
  - `model` (optional): string — model to use; if omitted, server uses
    `OPENAI_DEFAULT_MODEL`

- **Validation**:
  - Requests are validated with Zod (`chatInputSchema`).
  - On validation failure, the route responds with `400` and an error payload
    (see below).

### Successful Response

- **Status**: `200`
- **Headers**:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-store, no-transform`
  - `Connection: keep-alive`
- **Body**: NDJSON stream (newline-delimited JSON) directly passthrough from the
  OpenAI Responses API (no custom re-wrapping). Despite the `text/event-stream`
  header, the actual format is NDJSON - each line is ALWAYS a complete JSON
  object (never partial lines spanning chunks). The stream ends when OpenAI
  finishes or the client aborts.

### Error Responses (JSON)

When not streaming (auth/validation/upstream error), the route returns a JSON
error object with this shape:

```json
{
  "status": "error",
  "errorMessage": "string",
  "errorCode": number,
  "timestamp": "ISO-8601 string"
}
```

- **401 Unauthorized**: Missing/invalid session.
- **400 Bad Request**: Body missing or Zod validation failed; `errorMessage`
  contains details.
- **5xx Upstream/Error**: OpenAI or server error; `errorCode` reflects the HTTP
  status and `errorMessage` is parsed but never exposes secrets.

### Notes

- The server initializes OpenAI with the configured `OPENAI_API_KEY` and uses
  `OPENAI_DEFAULT_MODEL` when `model` is not provided in the request.
- Client aborts are propagated; if the client disconnects, the upstream OpenAI
  request is aborted and the stream is closed.
