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
import { SendIcon, Square as StopIcon } from "lucide-react";

import {
  chatMessageSchema,
  type ChatMessageFormData,
} from "@/modules/chat/schemas/chat-schema";

import { Card } from "@/components/ui/card";
import { ChatContainer } from "@/modules/chat/ui/components/chat-container";
import { KeyboardEvent, useRef, useState } from "react";
import {
  ChatMessage,
  ChatMessageContent,
  ChatMessageAuthor,
  MESSAGE_VARIANTS,
  ChatMessageError,
} from "@/modules/chat/ui/components/chat-message";
import { Loader } from "@/components/ui/loader";
import { useStreamMutation } from "@/hooks/use-stream-mutation";
import { config } from "@/lib/config";
import { nanoid } from "nanoid";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

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
  aborted?: boolean;
  abortReason?: string;
};

export const ChatView = ({ userName }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const pendingAssistantIdRef = useRef<string | null>(null);

  const form = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
    mode: "onSubmit",
  });

  const chat = useStreamMutation();

  const isFormValid = form.formState.isDirty && form.formState.isValid;

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
        onSuccess: dataResult => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: dataResult.finalText,
                    isLoading: false,
                    error: false,
                    responseId: dataResult.responseId ?? "",
                    aborted: dataResult.aborted ?? false,
                    abortReason: dataResult.abortReason ?? "",
                  }
                : msg,
            ),
          );
          pendingAssistantIdRef.current = null;
        },
        onError: error => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: chat.getLastStreamedTextPart() || "",
                    isLoading: false,
                    error: true,
                    errorMessage: error.message,
                    responseId: chat.getLastResponseId() ?? "",
                    aborted: false,
                    abortReason: "",
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

  const handleKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    opts: { isChatPending: boolean; isFormValid: boolean },
  ) => {
    if (e.key !== "Enter" || e.shiftKey) {
      return;
    }

    e.preventDefault();

    if (opts.isChatPending) {
      toast.info(
        "Can't send a new message while the previous one is generating",
      );
      return;
    }

    if (!opts.isFormValid) {
      toast.info("Message is required");
      return;
    }

    form.handleSubmit(onSubmit)();
  };

  const getButtonTooltipContent = (opts: {
    isChatPending: boolean;
    isFormValid: boolean;
  }) => {
    if (opts.isChatPending) {
      return "Click stop to abort generation";
    }

    if (!opts.isFormValid) {
      return "Message is required";
    }

    return "Send Message";
  };

  return (
    <>
      <ChatContainer className="flex h-full w-full flex-col justify-start gap-y-2 px-4 pt-12 pb-52">
        {messages.length === 0 ? (
          isFormValid ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-12">
              <h4 className="text-center text-xl font-bold">
                Looks great, ready to send?
              </h4>
              <p className="text-muted-foreground text-center text-sm">
                You&apos;ve started typing. Hit Ask to share your message.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-4 py-12">
              <h4 className="text-center text-xl font-bold">
                Ready to chat? Let&apos;s explore together!
              </h4>
              <p className="text-muted-foreground text-center text-sm">
                Just start typing your message in the box below and let&apos;s
                get this conversation going! 🚀
              </p>
            </div>
          )
        ) : (
          <>
            {messages.map(msg => {
              const isStreaming = msg.id === pendingAssistantIdRef.current;
              const content = isStreaming ? chat.streamedText : msg.content;
              const loading = isStreaming
                ? chat.isPending && chat.streamedText.length === 0
                : false;

              return (
                <ChatMessage
                  key={msg.id}
                  variant={msg.variant}
                  userName={userName}
                >
                  <ChatMessageAuthor>
                    {msg.variant === MESSAGE_VARIANTS.USER
                      ? userName || "User"
                      : config.appName}
                  </ChatMessageAuthor>
                  <ChatMessageContent>
                    {loading ? (
                      <div className="flex items-center gap-x-2">
                        <Loader variant="dots" size="lg" />
                      </div>
                    ) : (
                      <>
                        <p>{content}</p>
                        {msg.error ? (
                          <ChatMessageError>
                            {msg.errorMessage || "Something went wrong"}
                          </ChatMessageError>
                        ) : null}
                        {msg.aborted ? (
                          <ChatMessageError>
                            {msg.abortReason || "Aborted by user"}
                          </ChatMessageError>
                        ) : null}
                      </>
                    )}
                  </ChatMessageContent>
                </ChatMessage>
              );
            })}
          </>
        )}
      </ChatContainer>

      <section className="fixed right-0 bottom-0 left-0 z-50">
        <div className="container mx-auto w-full max-w-5xl px-4 py-4 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Card className="border-input bg-background/20 focus-within:ring-ring relative flex flex-col overflow-hidden rounded-md border px-4 py-4 backdrop-blur-lg focus-within:ring-2 focus-within:ring-offset-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Textarea
                              placeholder="Type your message here..."
                              className="max-h-[200px] min-h-[44px] flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              onKeyDown={e =>
                                handleKeyDown(e, {
                                  isChatPending: chat.isPending,
                                  isFormValid,
                                })
                              }
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={20}>
                            Press Enter to send or Shift+Enter for a newline
                          </TooltipContent>
                        </Tooltip>
                        <div className="flex justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {chat.isPending ? (
                                <Button
                                  type="button"
                                  onClick={() =>
                                    chat.abort("Generation aborted by the user")
                                  }
                                  className="cursor-pointer"
                                >
                                  <StopIcon />
                                  Stop
                                </Button>
                              ) : (
                                <Button
                                  type="submit"
                                  disabled={!isFormValid}
                                  className={`${!isFormValid ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  <SendIcon />
                                  Ask
                                </Button>
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={0}>
                              {getButtonTooltipContent({
                                isFormValid,
                                isChatPending: chat.isPending,
                              })}
                            </TooltipContent>
                          </Tooltip>
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
    </>
  );
};
