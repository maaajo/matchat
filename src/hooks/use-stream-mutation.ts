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
 * text as NDJSON frames arrive. The progressively accumulated text is available
 * via the returned `text` field (hook state only, not in mutation.data). The
 * created response id (useful for continuations) is exposed as
 * `data?.responseId` on success and is also
 * accessible at any time via `getLastResponseId()`.
 *
 * Returned API:
 * - React Query mutation object from `useMutation`
 * - `text`: progressively accumulated streamed text (cleared on each mutate)
 * - `data?.finalText`: final aggregated text once streaming completes
 * - `abort()`: cancels the in-flight fetch/stream
 * - `getLastResponseId()`: returns the last seen response id (if any)
 *
 * Derive common flags in UI:
 * - `isStreaming`: `mutation.isPending && text.length > 0`
 * - `isGeneratingText`: same as `isStreaming`
 *
 * Notes:
 * - Errors (non-2xx, malformed frames, network) surface as `mutation.error`.
 * - On abort, streaming stops and no further text is appended.
 *
 * @param options Optional config, e.g. `key` to extend the mutation key.
 * @returns Mutation with `{ text, abort, getLastResponseId }` helpers; final text
 * is available on `data?.finalText`.
 *
 * @example Basic usage
 * const { mutate, isPending, data, text, abort, getLastResponseId } =
 *   useStreamMutation();
 *
 * // Start streaming
 * mutate({ input: "Hello!" });
 *
 * // Derive flags
 * const isStreaming = isPending && text.length > 0;
 *
 * // Access response id after success: data?.responseId
 * // Access final text after success: data?.finalText
 *
 * @example Continuation (follow-up request using previous response)
 * const m = useStreamMutation();
 *
 * // Use id from last successful mutation result
 * m.mutate({ input: "Continue", previous_response_id: m.data?.responseId });
 *
 * // Or use the helper, which is set as soon as the stream emits `response.created`
 * m.mutate({ input: "Continue", previous_response_id: m.getLastResponseId() });
 */
export function useStreamMutation(options?: { key?: readonly unknown[] }) {
  const [streamedText, setStreamedText] = useState("");
  const lastResponseIdRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  let finalText: string;
  const latestStreamedTextRef = useRef<string>("");

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const abort = () => {
    abortControllerRef.current?.abort();
  };

  const mutation = useMutation<
    { responseId?: string; finalText: string },
    Error,
    ChatOpenAIClientInput
  >({
    mutationKey: ["chat-openai", ...(options?.key ?? [])],
    mutationFn: async (payload: ChatOpenAIClientInput) => {
      setStreamedText("");
      lastResponseIdRef.current = undefined;
      finalText = "";
      latestStreamedTextRef.current = "";
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

        try {
          await parseNDJSONStream(reader, event => {
            if (isOutputTextDelta(event)) {
              accumulatedText += event.delta || "";
              setStreamedText(accumulatedText);
              latestStreamedTextRef.current = accumulatedText;
            } else if (isResponseCreated(event)) {
              lastResponseIdRef.current = event.response.id;
            } else if (isResponseCompleted(event)) {
              finalText = accumulatedText;
            }
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return {
              responseId: lastResponseIdRef.current,
              finalText,
            };
          }
          throw error;
        }

        return {
          responseId: lastResponseIdRef.current,
          finalText,
        };
      } catch (error) {
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    onError: () => {
      // Error occurred, streamedText will be empty
    },
  });

  return {
    ...mutation,
    text: streamedText,
    abort,
    getLastResponseId: () => lastResponseIdRef.current,
    getLastStreamedText: () => latestStreamedTextRef.current,
  };
}

export type UseStreamMutationReturn = ReturnType<typeof useStreamMutation>;
