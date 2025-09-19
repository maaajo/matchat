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
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Announcement, AnnouncementTitle } from "@/components/ui/accouncement";
import { MESSAGE_VARIANTS } from "@/modules/chat/lib/constants";

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
  const trpc = useTRPC();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const pendingAssistantIdRef = useRef<string | null>(null);
  const createdChatIdRef = useRef<string | null>(null);
  const didInsertChatRef = useRef(false);

  const form = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
    mode: "onSubmit",
  });

  const streamChat = useStreamMutation();

  const isFormValid = form.formState.isDirty && form.formState.isValid;

  const insertChatToDB = useMutation(trpc.chat.create.mutationOptions());
  const insertMessageToDB = useMutation(trpc.message.add.mutationOptions());
  const updateChatDB = useMutation(trpc.chat.update.mutationOptions());

  const onSubmit = async (userChat: ChatMessageFormData) => {
    const userId = nanoid();
    const assistantId = nanoid();
    const userMessageDate = new Date();

    if (!createdChatIdRef.current) {
      createdChatIdRef.current = nanoid();
      window.history.replaceState({}, "", `/chat/${createdChatIdRef.current}`);
    }

    setMessages(prev => [
      ...prev,
      {
        id: userId,
        variant: MESSAGE_VARIANTS.USER,
        content: userChat.message,
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

    streamChat.mutateAsync(
      {
        input: userChat.message,
        previous_response_id: streamChat.getLastResponseId(),
      },
      {
        onSuccess: dataResult => {
          insertMessageToDB.mutateAsync([
            {
              chatId: createdChatIdRef.current!,
              content: userChat.message,
              role: MESSAGE_VARIANTS.USER,
              aborted: !!dataResult.aborted,
              abortedReason: dataResult.abortReason,
              createdAt: userMessageDate.toISOString(),
            },
            {
              chatId: createdChatIdRef.current!,
              content: dataResult.finalText,
              role: MESSAGE_VARIANTS.ASSISTANT,
              aborted: false,
              createdAt: new Date(userMessageDate.getTime() + 1).toISOString(),
            },
          ]);
          updateChatDB.mutateAsync({
            id: createdChatIdRef.current!,
            lastValidResponseId: dataResult.responseId,
          });
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
                    content: streamChat.getLastStreamedTextPart() || "",
                    isLoading: false,
                    error: true,
                    errorMessage: error.message,
                    responseId: streamChat.getLastResponseId() ?? "",
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

    if (!didInsertChatRef.current && createdChatIdRef.current) {
      didInsertChatRef.current = true;
      try {
        const createdChat = await insertChatToDB.mutateAsync({
          id: createdChatIdRef.current,
          userChatMessage: userChat.message,
        });
        setChatTitle(createdChat?.title ?? null);
        if (createdChat?.title) {
          document.title = `${createdChat.title} - ${config.appName}`;
        }
      } catch {
        didInsertChatRef.current = false;
        toast.error("Failed to create chat");
        return;
      }
    }

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
      <ChatContainer className="flex w-full flex-col items-center justify-start gap-y-2 px-4 pt-12">
        {chatTitle ? (
          <Announcement className="text-secondary-foreground bg-secondary shadow-secondary text-xs shadow-lg">
            <AnnouncementTitle>{chatTitle}</AnnouncementTitle>
          </Announcement>
        ) : null}
        {messages.length === 0 ? (
          isFormValid ? (
            <div className="flex min-h-[calc(100dvh-theme(spacing.48)-theme(spacing.12))] flex-col items-center justify-center px-4 py-12">
              <h4 className="text-center text-xl font-bold">
                Looks great, ready to send?
              </h4>
              <p className="text-muted-foreground text-center text-sm">
                You&apos;ve started typing. Hit Ask to share your message.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[calc(100dvh-theme(spacing.48)-theme(spacing.12))] flex-col items-center justify-center px-4 py-12">
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
              const content = isStreaming
                ? streamChat.streamedText
                : msg.content;
              const isLoading = isStreaming
                ? streamChat.isPending && streamChat.streamedText.length === 0
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
                    {isLoading ? (
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
                                  isChatPending: streamChat.isPending,
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
                              {streamChat.isPending &&
                              !insertChatToDB.isPending ? (
                                <Button
                                  type="button"
                                  onClick={() =>
                                    streamChat.abort(
                                      "Generation aborted by the user",
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  <StopIcon />
                                  Stop
                                </Button>
                              ) : (
                                <Button
                                  type="submit"
                                  disabled={
                                    !isFormValid || insertChatToDB.isPending
                                  }
                                  isLoading={insertChatToDB.isPending}
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
                                isChatPending: streamChat.isPending,
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
