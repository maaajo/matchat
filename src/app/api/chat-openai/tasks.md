# v1 Implementation Tasks - OpenAI Chat API

## Overview

Implementation tasks for v1 of the authenticated OpenAI chat route that streams
tokens for a chat UI.

## Phase 1: Project Setup & Dependencies

### 1.1 Install Required Dependencies

- [x] Install OpenAI SDK: `npm install openai`
- [x] Install Zod for validation: `npm install zod`
- [x] Install Vitest for testing: `npm install -D vitest`
- [x] Verify better-auth is already configured

### 1.2 Environment Configuration

- [x] Add `OPENAI_API_KEY` to environment variables
- [x] Add `OPENAI_DEFAULT_MODEL` (e.g., "gpt-4o-mini") to environment variables
- [x] Update env validation schemas in `src/env/server.ts` to include OpenAI
      config
- [x] Add `OPENAI_API_KEY: z.string().min(1)` to serverEnv schema
- [x] Add `OPENAI_DEFAULT_MODEL: z.string().min(1)` to serverEnv schema (no
      default, use process.env directly)

## Phase 2: Core Implementation

### 2.1 Create Route File

- [x] Create `/api/chat-openai/route.ts`
- [x] Implement POST method handler

### 2.2 Create Unified API Response Type

- [x] Create a union type for standardized API responses:
  - Define status type: `type ApiStatus = "success" | "error"`
  - Success case: `{ status: ApiStatus, response: T, timestamp?: string }`
  - Error case:
    `{ status: ApiStatus, errorMessage: string, errorCode?: string, timestamp?: string }`
- [x] Implement proper TypeScript types for the response union
- [x] Use this type consistently across all API endpoints

### 2.3 Authentication Layer

- [x] Import and configure better-auth for server-side auth
- [x] Implement authentication check inside route handler
- [x] Return 401 with proper JSON response on auth failure
- [x] Extract user ID for future rate limiting (v2)

### 2.4 Request Validation Schema

- [x] Create Zod schema for request validation aligned to Responses API:
  - `input`: required; either string or ResponseInput
    "openai/resources/responses/responses"
  - `previous_response_id`: optional string (for continuing the conversation)
  - `model`: optional string (use server default if omitted)
- [x] Add clear error messages for validation failures
- [x] Add empty request body validation
- [x] Add request body validation to parse against created zod schema
- [x] Parse request body as the type of zod schema

### 2.5 OpenAI Integration

- [x] Initialize OpenAI client with API key
- [x] Implement chat completion call with streaming
- [x] Handle model selection (use default if not specified)
- [x] Pass through all validated parameters to OpenAI

### 2.6 Streaming Implementation

- [x] Set proper SSE headers:
  - `Content-Type: text/event-stream; charset=utf-8`
  - `Cache-Control: no-store, no-transform`
  - `Connection: keep-alive`
- [x] Disable compression for this route
- [x] Implement streaming response using OpenAI SDK passthrough
- [x] Ensure no custom event re-enveloping (pure passthrough)

### 2.7 Error Handling

- [x] Handle 400 validation failures with Zod error details
- [x] Handle upstream non-2xx responses with JSON (no stream)
- [x] Handle mid-stream upstream errors (close connection)
- [x] Never expose `OPENAI_API_KEY` in responses
- [x] Add proper error logging with request IDs

### 2.8 Abort & Cleanup

- [ ] Listen to request abort signal
- [ ] Propagate client cancel to OpenAI SDK
- [ ] Abort upstream request if client disconnects
- [ ] Close server stream promptly
- [ ] Free sockets/resources on completion

## Phase 3: Testing

### 3.1 Test Setup

- [ ] Configure Vitest for API route testing
- [ ] Set up test environment variables
- [ ] Create test utilities for auth mocking

### 3.2 Schema Validation Tests

- [ ] Test valid request payloads
- [ ] Test message count limits (max 30)
- [ ] Test per-message content length limits (1-4000 chars)
- [ ] Test total content length limit (40,000 chars)
- [ ] Test temperature bounds [0, 2]
- [ ] Test maxOutputTokens validation
- [ ] Test responseFormat validation

### 3.3 Route Behavior Tests

- [ ] Test happy path streaming
- [ ] Test authentication failure (401)
- [ ] Test validation failures (400)
- [ ] Test upstream error handling
- [ ] Test client abort/cancellation
- [ ] Test SSE headers are set correctly

### 3.4 Integration Tests

- [ ] Mock OpenAI SDK responses
- [ ] Test streaming behavior with mocked responses
- [ ] Test error propagation from OpenAI
- [ ] Test abort signal handling

## Phase 4: Configuration & Optimization

### 4.1 Route Configuration

- [ ] Disable compression for `/api/chat-openai` route
- [ ] Configure proper timeout settings
- [ ] Set appropriate body size limits

### 4.2 Observability

- [ ] Add request ID logging
- [ ] Log chosen model and duration
- [ ] Capture token usage if available
- [ ] Avoid logging raw prompts/PII by default

### 4.3 Security Hardening

- [ ] Verify no sensitive data exposure
- [ ] Test rate limiting preparation (for v2)
- [ ] Ensure proper input sanitization

## Phase 5: Documentation & Validation

### 5.1 API Documentation

- [ ] Document request/response contracts
- [ ] Document error codes and messages
- [ ] Add usage examples

### 5.2 Acceptance Criteria Validation

- [ ] Verify authenticated users can POST and receive live stream
- [ ] Verify Zod rejects invalid payloads with 400 and clear reasons
- [ ] Verify SSE headers are set correctly
- [ ] Verify client cancellation stops upstream request
- [ ] Verify all test scenarios pass

## Dependencies & Prerequisites

### Required

- Next.js 15 with App Router
- TypeScript
- better-auth configured and working
- OpenAI API key and account

### Development

- Vitest for testing
- Zod for validation
- OpenAI SDK

## Notes

- Keep implementation simple and production-sane
- Focus on reliability and streaming performance
- Prepare for v2 rate limiting integration
- No frontend work required in v1
- Use Node runtime for best streaming compatibility

## Success Metrics

- [ ] All tests pass
- [ ] Streaming works reliably
- [ ] Authentication enforced properly
- [ ] Error handling comprehensive
- [ ] Performance acceptable for production use
