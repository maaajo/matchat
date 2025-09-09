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
 * via the returned `streamedText` field (hook state only, not in mutation.data).
 * The created response id (useful for continuations) is exposed as
 * `data?.responseId` on success. On abort, `data?.finalText` contains the last
 * accumulated text at the moment of abort, and `data?.aborted === true` with
 * `data?.abortReason` populated from `AbortSignal.reason`.
 *
 * Returned API:
 * - React Query mutation object from `useMutation`
 * - `streamedText`: progressively accumulated streamed text (cleared on each mutate)
 * - `data?.finalText`: final aggregated text once streaming completes or when aborted
 * - `data?.aborted`: boolean indicating whether the request was aborted
 * - `data?.abortReason`: abort reason from `AbortSignal.reason` (if aborted)
 * - `abort()`: cancels the in-flight fetch/stream with optional reason
 *
 * Derive common flags in UI:
 * - `isStreaming`: `mutation.isPending && streamedText.length > 0`
 * - `isGeneratingText`: same as `isStreaming`
 *
 * Notes:
 * - Errors (non-2xx, malformed frames, network) surface as `mutation.error`.
 * - On abort, streaming stops, no further text is appended, and `finalText` contains
 *   whatever was accumulated so far.
 *
 * @param options Optional config, e.g. `key` to extend the mutation key.
 * @returns Mutation with `{ streamedText, abort }` helpers; final text is
 * available on `data?.finalText` (also when aborted).
 *
 * @example Basic usage
 * const { mutate, isPending, data, streamedText, abort } =
 *   useStreamMutation();
 *
 * // Start streaming
 * mutate({ input: "Hello!" });
 *
 * // Derive flags
 * const isStreaming = isPending && streamedText.length > 0;
 *
 * // Access response id after success: data?.responseId
 * // Access final text after success or abort: data?.finalText
 * // Check if aborted and why: data?.aborted, data?.abortReason
 *
 * @example Continuation (follow-up request using previous response)
 * const m = useStreamMutation();
 *
 * // Use id from last successful mutation result
 * m.mutate({ input: "Continue", previous_response_id: m.data?.responseId });
 */
export function useStreamMutation(options?: { key?: readonly unknown[] }) {
  const [streamedText, setStreamedText] = useState("");
  const lastResponseIdRef = useRef<string | undefined>(undefined);
  const abortReasonRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
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
      // Preserve last successful response id across runs
      finalText = "";
      abortReasonRef.current = undefined;
      abortControllerRef.current = new AbortController();
      // reset abort state on new mutation

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
            abortReasonRef.current =
              abortControllerRef.current?.signal.reason || "Aborted by user";
            return {
              responseId: lastResponseIdRef.current,
              finalText: accumulatedText,
              aborted: true,
              abortReason: abortReasonRef.current,
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
    onError: () => {
      // Error occurred, streamedText will be empty
    },
  });

  return {
    ...mutation,
    streamedText,
    abort,
    getLastResponseId: () => lastResponseIdRef.current,
    getAbortReason: () => abortReasonRef.current,
  };
}

export type UseStreamMutationReturn = ReturnType<typeof useStreamMutation>;
