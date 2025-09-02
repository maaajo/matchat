"use client";

import type { ChatInput } from "@/app/api/chat-openai/schema";
import { useRef, useState } from "react";
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

export function useStreamMutation() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [responseId, setResponseId] = useState<string>();
  const [previousResponseId, setPreviousResponseId] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const mutation = useMutation({
    mutationFn: async (payload: ChatOpenAIClientInput) => {
      setIsStreaming(true);
      setStreamedText("");
      setFinalText("");
      setResponseId(undefined);

      abortControllerRef.current = new AbortController();

      if (payload.previous_response_id) {
        setPreviousResponseId(payload.previous_response_id);
      }

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
          } catch (error) {}
          throw new Error(errorMessage);
        }

        if (!response.body) {
          return;
        }

        const reader = response.body.getReader();
        let accumulatedText = "";

        try {
          await parseNDJSONStream(reader, event => {
            if (isOutputTextDelta(event)) {
              accumulatedText += event.delta || "";
              setStreamedText(accumulatedText);
            } else if (isResponseCreated(event)) {
              setResponseId(event.response.id);
            } else if (isResponseCompleted(event)) {
              setFinalText(accumulatedText);
              setIsStreaming(false);
            }
          });
        } catch (error) {
          setIsStreaming(false);
          throw new Error(`Stream parsing failed: ${error}`);
        }

        if (!finalText && accumulatedText) {
          setFinalText(accumulatedText);
        }
      } catch (error) {
        setIsStreaming(false);
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    onError: () => {
      setIsStreaming(false);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isStreaming,
    streamedText,
    finalText,
    responseId,
    previousResponseId,
    error: mutation.error,
    abort,
  };
}
