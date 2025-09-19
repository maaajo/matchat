"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ChatView } from "@/modules/chat/ui/views/chat-view";
import { UIChatMessage } from "@/modules/chat/ui/components/chat-message";

type ChatViewContainerProps = {
  chatId: string;
  userName?: string;
};

export function ChatViewContainer({
  chatId,
  userName,
}: ChatViewContainerProps) {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.chat.getOne.queryOptions({ id: chatId }),
  );

  const messages: UIChatMessage[] = data.messages.map(message => ({
    id: message.id,
    variant: message.role,
    content: message.content,
    isLoading: false,
    error: message.aborted,
    errorMessage: message.abortedReason ?? undefined,
    aborted: message.aborted,
    abortReason: message.abortedReason ?? undefined,
  }));

  return (
    <ChatView
      userName={userName}
      chatId={chatId}
      initialTitle={data.title}
      chatMessages={messages}
      lastValidResponseId={data.lastValidResponseId}
    />
  );
}
