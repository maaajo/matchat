"use client";

import type { ChatInput } from "@/app/api/chat-openai/schema";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import wretch from "wretch";
import AbortAddon from "wretch/addons/abort";
import {
  isOutputTextDelta,
  isResponseCreated,
  parseNDJSONStream,
} from "@/lib/stream-parser";

// Re-export ChatInput as ChatOpenAIClientInput for client-side usage
// Includes: input (string | message array), previous_response_id?: string, model?: string
export type ChatOpenAIClientInput = ChatInput;

export function useStreamMutation() {
  const [streamedText, setStreamedText] = useState("");
  const lastResponseIdRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = () => {
    abortControllerRef.current?.abort();
  };

  const mutation = useMutation<
    { responseId?: string; text: string },
    Error,
    ChatOpenAIClientInput
  >({
    mutationFn: async (payload: ChatOpenAIClientInput) => {
      setStreamedText("");
      lastResponseIdRef.current = undefined;

      abortControllerRef.current = new AbortController();

      try {
        const response = await wretch("/api/chat-openai")
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
          return { responseId: lastResponseIdRef.current, text: "" };
        }

        const reader = response.body.getReader();
        let accumulatedText = "";

        try {
          await parseNDJSONStream(reader, event => {
            if (isOutputTextDelta(event)) {
              accumulatedText += event.delta || "";
              setStreamedText(accumulatedText);
            } else if (isResponseCreated(event)) {
              lastResponseIdRef.current = event.response.id;
            }
          });
        } catch (error) {
          throw new Error(`Stream parsing failed: ${error}`);
        }

        return { responseId: lastResponseIdRef.current, text: accumulatedText };
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
  };
}
