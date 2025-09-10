"use client";

import type { ChatInput } from "@/app/api/chat-openai/schema";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import wretch from "wretch";
import AbortAddon from "wretch/addons/abort";
import {
  isOutputTextDelta,
  isResponseCompleted,
  isResponseCreated,
  parseNDJSONStream,
} from "@/lib/stream-parser";

// Re-export ChatInput as ChatOpenAIClientInput for client-side usage
// Includes: input (string | message array), previous_response_id?: string, model?: string
export type ChatOpenAIClientInput = ChatInput;

/**
 * Streaming mutation hook for the OpenAI Responses API (client-side).
 *
 * Starts a POST request to `/api/chat-openai` and incrementally exposes streamed
 * text as NDJSON frames arrive.
 *
 * Progressive text exposure:
 * - `streamedText` (state): use for live rendering in the component.
 * - `getLastStreamedTextPart()` (ref-backed getter): use inside callbacks
 *   (e.g. `onError`) to avoid stale closures and read the latest partial text.
 *   This value is cleared on each new `mutate` call.
 *
 * Id semantics:
 * - The response id is COMMITTED only when a `response.completed` event arrives.
 * - Aborted runs never overwrite the last successful id.
 * - The last successful id can be read via `getLastResponseId()` and is also
 *   returned as `data.responseId` on success/abort.
 *
 * Abort semantics:
 * - Call `abort(reason?)` to cancel the in-flight stream. The mutation resolves
 *   successfully with `{ aborted: true, finalText, abortReason, responseId }`.
 *   The last successful id is preserved.
 *
 * Error semantics:
 * - Non-2xx, malformed frames, or network failures REJECT the mutation.
 * - In that case `data` is `undefined` and `error` is populated.
 * - Use `getLastResponseId()` for the continuation id and
 *   `getLastStreamedTextPart()` to retrieve the latest partial text for UI.
 *
 * Returned API:
 * - React Query mutation object from `useMutation`
 * - `streamedText`: progressively accumulated streamed text (cleared on each mutate)
 * - `abort()`: cancels the in-flight fetch/stream with optional reason
 * - `getLastResponseId()`: returns the last successfully completed response id
 * - `getLastStreamedTextPart()`: returns the latest partial text (ref-backed)
 *
 * Derive common flags in UI:
 * - `isStreaming`: `mutation.isPending && streamedText.length > 0`
 * - `isGeneratingText`: same as `isStreaming`
 *
 * @param options Optional config, e.g. `key` to extend the mutation key.
 * @returns Mutation with `{ streamedText, abort, getLastResponseId, getLastStreamedTextPart }`.
 *
 * @example Basic usage
 * const { mutate, isPending, streamedText, abort } = useStreamMutation();
 * mutate({ input: "Hello!" });
 * const isStreaming = isPending && streamedText.length > 0;
 *
 * @example Continuation (follow-up request using previous response)
 * const m = useStreamMutation();
 * m.mutate({ input: "Continue", previous_response_id: m.getLastResponseId() });
 *
 * @example Handling errors with partial text inside callbacks
 * const m = useStreamMutation();
 * m.mutate({ input }, {
 *   onError: (err) => {
 *     const partial = m.getLastStreamedTextPart();
 *     const continueFrom = m.getLastResponseId();
 *     // Update UI with `partial` and keep `continueFrom` for retry
 *   }
 * });
 */
export function useStreamMutation(options?: { key?: readonly unknown[] }) {
  const [streamedText, setStreamedText] = useState("");
  const lastResponseIdRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastStreamedTextRef = useRef("");
  let finalText: string;

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const abort = (abortMessage?: string) => {
    abortControllerRef.current?.abort(abortMessage);
  };

  const mutation = useMutation<
    {
      responseId?: string;
      finalText: string;
      aborted?: boolean;
      abortReason?: string;
    },
    Error,
    ChatOpenAIClientInput
  >({
    mutationKey: ["chat-openai", ...(options?.key ?? [])],
    mutationFn: async (payload: ChatOpenAIClientInput) => {
      setStreamedText("");
      lastStreamedTextRef.current = "";
      finalText = "";
      abortControllerRef.current = new AbortController();

      try {
        const response = await wretch("/api/chat-openai")
          .options({ credentials: "same-origin" })
          .addon(AbortAddon())
          .signal(abortControllerRef.current)
          .post(payload)
          .res();

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        if (!response.body) {
          return {
            responseId: lastResponseIdRef.current,
            finalText,
          };
        }

        const reader = response.body.getReader();
        let accumulatedText = "";
        let createdId: string | undefined = undefined;

        try {
          await parseNDJSONStream(reader, event => {
            if (isOutputTextDelta(event)) {
              accumulatedText += event.delta || "";
              setStreamedText(accumulatedText);
              lastStreamedTextRef.current = accumulatedText;
            } else if (isResponseCreated(event)) {
              createdId = event.response.id;
            } else if (isResponseCompleted(event)) {
              finalText = accumulatedText;
              if (createdId) {
                lastResponseIdRef.current = createdId;
              }
            }
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return {
              responseId: lastResponseIdRef.current,
              finalText: accumulatedText,
              aborted: true,
              abortReason:
                abortControllerRef.current?.signal.reason || "Aborted by user",
            };
          }
          throw error;
        }

        return {
          responseId: lastResponseIdRef.current,
          finalText,
          aborted: false,
        };
      } catch (error) {
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
  });

  return {
    ...mutation,
    streamedText,
    abort,
    getLastResponseId: () => lastResponseIdRef.current,
    getLastStreamedTextPart: () => lastStreamedTextRef.current,
  };
}

export type UseStreamMutationReturn = ReturnType<typeof useStreamMutation>;
