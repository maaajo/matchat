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
import { useState } from "react";
import {
  ChatMessage,
  ChatMessageContent,
  MESSAGE_VARIANTS,
} from "@/modules/chat/ui/components/chat-message";
import { useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";

type ChatViewProps = {
  userName?: string;
};

type ChatMessage = {
  variant: (typeof MESSAGE_VARIANTS)[keyof typeof MESSAGE_VARIANTS];
  content: string;
  isLoading: boolean;
};

const testMessages: ChatMessage[] = [
  {
    variant: MESSAGE_VARIANTS.ASSISTANT,
    content: "Hello, what can I help you with?",
    isLoading: false,
  },
  {
    variant: MESSAGE_VARIANTS.USER,
    content: "Tell me a dad joke",
    isLoading: false,
  },
  {
    variant: MESSAGE_VARIANTS.ASSISTANT,
    content: "Here is a dad joke",
    isLoading: false,
  },
  { variant: MESSAGE_VARIANTS.USER, content: "Tell me more", isLoading: false },
  { variant: MESSAGE_VARIANTS.ASSISTANT, content: "Test", isLoading: true },
];

export const ChatView = ({ userName }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(testMessages);
  const form = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  const { isSubmitting } = form.formState;
  const userMessage = useWatch({
    control: form.control,
    name: "message",
    compute: (data: string) => {
      return data.length ? data : "";
    },
  });

  console.log(userMessage);

  const onSubmit = (data: ChatMessageFormData) => {
    console.log("Message submitted:", data.message);
    // TODO: Implement message sending logic
    setMessages(oldValue => [
      ...oldValue,
      {
        variant: MESSAGE_VARIANTS.USER,
        content: data.message,
        isLoading: false,
      },
    ]);
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
          messages.map(({ content, variant, isLoading }) => (
            <ChatMessage key={content} variant={variant} userName={userName}>
              <ChatMessageContent>
                {isLoading ? (
                  <div className="flex items-center gap-x-2">
                    <Loader variant="dots" size="lg" />
                  </div>
                ) : (
                  <p>{content}</p>
                )}
              </ChatMessageContent>
            </ChatMessage>
          ))
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
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
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
    </>
  );
};
