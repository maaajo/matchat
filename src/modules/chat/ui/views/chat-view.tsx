"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

import {
  chatMessageSchema,
  type ChatMessageFormData,
} from "@/modules/chat/schemas/chat-schema";

import { Card } from "@/components/ui/card";
import { ChatContainer } from "@/modules/chat/ui/components/chat-container";
import { useRef, useState } from "react";
import {
  ChatMessage,
  ChatMessageContent,
  ChatMessageName,
  MESSAGE_VARIANTS,
} from "@/modules/chat/ui/components/chat-message";
import { useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { useStreamMutation } from "@/hooks/use-stream-mutation";
import { StreamMutationDebug } from "@/modules/chat/ui/components/chat-stream-debug";
import { config } from "@/lib/config";
import { nanoid } from "nanoid";

type ChatViewProps = {
  userName?: string;
};

type ChatMessage = {
  id: string;
  variant: (typeof MESSAGE_VARIANTS)[keyof typeof MESSAGE_VARIANTS];
  content: string;
  isLoading?: boolean;
  responseId?: string;
  error?: boolean;
  errorMessage?: string;
};

export const ChatView = ({ userName }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const pendingAssistantIdRef = useRef<string | null>(null);

  const form = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  const chat = useStreamMutation();
  const userMessage = useWatch({
    control: form.control,
    name: "message",
    compute: (data: string) => {
      return data.length ? data : "";
    },
  });

  const onSubmit = (data: ChatMessageFormData) => {
    const userId = nanoid();
    const assistantId = nanoid();

    setMessages(prev => [
      ...prev,
      {
        id: userId,
        variant: MESSAGE_VARIANTS.USER,
        content: data.message,
        isLoading: false,
      },
      {
        id: assistantId,
        variant: MESSAGE_VARIANTS.ASSISTANT,
        content: "",
        isLoading: true,
      },
    ]);

    pendingAssistantIdRef.current = assistantId;

    chat.mutate(
      {
        input: data.message,
        previous_response_id: chat.getLastResponseId(),
      },
      {
        onError: () => {},
        onSettled: (dataResult, error) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content:
                      dataResult?.finalText ?? chat.getLastStreamedText() ?? "",
                    isLoading: false,
                    error: !!error,
                    errorMessage: error?.message,
                    responseId:
                      dataResult?.responseId ?? chat.getLastResponseId(),
                  }
                : msg,
            ),
          );
          pendingAssistantIdRef.current = null;
        },
      },
    );

    form.reset();
  };

  return (
    <>
      <ChatContainer
        className={cn(
          "w-full px-4 py-12",
          messages.length === 0 ? "items-center justify-center" : null,
        )}
      >
        {messages.length === 0 ? (
          userMessage ? (
            <>
              <h4 className="max-w-md text-center text-xl font-bold">
                Looks great, ready to send?
              </h4>
              <p className="text-muted-foreground text-center text-sm">
                You&apos;ve started typing. Hit Ask to share your message.
              </p>
            </>
          ) : (
            <>
              <h4 className="max-w-md text-center text-xl font-bold">
                Ready to chat? Let&apos;s explore together!
              </h4>
              <p className="text-muted-foreground text-center text-sm">
                Just start typing your message in the box below and let&apos;s
                get this conversation going! 🚀
              </p>
            </>
          )
        ) : (
          messages.map(msg => {
            const isStreaming = msg.id === pendingAssistantIdRef.current;
            const content = isStreaming ? chat.text : msg.content;
            const loading = isStreaming
              ? chat.isPending && chat.text.length === 0
              : false;

            return (
              <ChatMessage
                key={msg.id}
                variant={msg.variant}
                userName={userName}
              >
                <ChatMessageName>
                  {msg.variant === MESSAGE_VARIANTS.USER
                    ? userName || "User"
                    : config.appName}
                </ChatMessageName>
                <ChatMessageContent>
                  {loading ? (
                    <div className="flex items-center gap-x-2">
                      <Loader variant="dots" size="lg" />
                    </div>
                  ) : (
                    <>
                      <p>{content}</p>
                      {msg.error ? (
                        <div className="text-destructive mt-2 text-xs">
                          {msg.errorMessage || "Something went wrong"}
                        </div>
                      ) : null}
                    </>
                  )}
                </ChatMessageContent>
              </ChatMessage>
            );
          })
        )}
      </ChatContainer>
      <section className="w-full">
        <div className="px-4 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Card className="border-input bg-background focus-within:ring-ring relative flex flex-col overflow-hidden rounded-md border px-4 py-4 focus-within:ring-2 focus-within:ring-offset-2">
                        <Textarea
                          placeholder="Type your message here..."
                          className="max-h-[200px] min-h-[44px] flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            isLoading={chat.isPending}
                            disabled={chat.isPending}
                          >
                            <SendIcon />
                            Ask
                          </Button>
                        </div>
                      </Card>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </section>
      <div className="px-4 pb-8">
        <StreamMutationDebug m={chat} />
      </div>
    </>
  );
};
