import type { ChatInput } from "@/app/api/chat-openai/schema";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

// Re-export ChatInput as ChatOpenAIClientInput for client-side usage
// Includes: input (string | message array), previous_response_id?: string, model?: string
export type ChatOpenAIClientInput = ChatInput;

export function useStreamMutation() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [responseId, setResponseId] = useState<string>();
  const [previousResoponseId, setPreviousResponseId] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const mutation = useMutation({});
}
