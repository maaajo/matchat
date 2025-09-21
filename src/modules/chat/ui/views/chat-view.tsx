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
  UIChatMessage,
  ChatMessage,
  ChatMessageContent,
  ChatMessageAuthor,
  ChatMessageError,
} from "@/modules/chat/ui/components/chat-message";
import { DotsLoader, Loader } from "@/components/ui/loader";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Announcement, AnnouncementTitle } from "@/components/ui/announcement";
import { MESSAGE_VARIANTS } from "@/modules/chat/lib/constants";

type ChatViewProps = {
  userName?: string;
  chatId?: string;
  initialTitle?: string | null;
  chatMessages?: UIChatMessage[];
  lastValidResponseId?: string | null;
};

export const ChatView = ({
  userName,
  chatId,
  initialTitle,
  chatMessages,
  lastValidResponseId,
}: ChatViewProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<UIChatMessage[]>(chatMessages ?? []);
  const [chatTitle, setChatTitle] = useState<string | null>(
    initialTitle ?? null,
  );
  const pendingAssistantIdRef = useRef<string | null>(null);
  const createdChatIdRef = useRef<string | null>(chatId ?? null);
  const isExistingChat = !!createdChatIdRef.current;

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
    form.reset();

    const userId = nanoid();
    const assistantId = nanoid();

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

    if (!isExistingChat && !createdChatIdRef.current) {
      const newChatId = nanoid();
      try {
        const newChat = await insertChatToDB.mutateAsync({
          id: newChatId,
          userChatMessage: userChat.message,
          isStreaming: true,
        });
        setChatTitle(newChat.title);

        createdChatIdRef.current = newChatId;
        window.history.replaceState(null, "", `/chat/${newChatId}`);
        queryClient.invalidateQueries(trpc.chat.getAllByUserId.queryOptions());
      } catch (error) {
        toast.error(
          "Failed to start a new chat. Please try again, error: " + error,
        );
        return;
      }
    } else {
      updateChatDB.mutateAsync(
        {
          id: createdChatIdRef.current!,
          isStreaming: true,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(
              trpc.chat.getAllByUserId.queryOptions(),
            );
          },
        },
      );
    }

    if (!createdChatIdRef.current) {
      toast.error("Chat ID is missing. Cannot send message.");
      return;
    }

    const userMessageDate = new Date();

    pendingAssistantIdRef.current = assistantId;

    streamChat.mutateAsync(
      {
        input: userChat.message,
        previous_response_id:
          streamChat.getLastResponseId() ?? lastValidResponseId ?? undefined,
      },
      {
        onSuccess: dataResult => {
          insertMessageToDB.mutateAsync([
            {
              chatId: createdChatIdRef.current!,
              content: userChat.message,
              role: MESSAGE_VARIANTS.USER,
              aborted: false,
              createdAt: userMessageDate.toISOString(),
            },
            {
              chatId: createdChatIdRef.current!,
              content: dataResult.finalText,
              role: MESSAGE_VARIANTS.ASSISTANT,
              aborted: !!dataResult.aborted,
              abortedReason: dataResult.abortReason,
              createdAt: new Date(userMessageDate.getTime() + 1).toISOString(),
            },
          ]);
          updateChatDB.mutateAsync(
            {
              id: createdChatIdRef.current!,
              lastValidResponseId: dataResult.responseId,
              isStreaming: false,
            },
            {
              onSuccess: () => {
                queryClient.invalidateQueries(
                  trpc.chat.getAllByUserId.queryOptions(),
                );
              },
            },
          );
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
        {messages.length !== 0 ? (
          <Announcement className="text-secondary-foreground bg-secondary shadow-secondary text-xs shadow-lg">
            <AnnouncementTitle>
              {!chatTitle ? (
                <div className="flex items-center gap-x-2">
                  <DotsLoader size="lg" color="bg-primary-foreground" />
                </div>
              ) : (
                chatTitle
              )}
            </AnnouncementTitle>
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
                    {msg.isLoading && !content ? (
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

      <section className="fixed bottom-0 z-50 w-full">
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
