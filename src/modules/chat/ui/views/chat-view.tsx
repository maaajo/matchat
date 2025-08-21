"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Highlighter } from "@/components/magicui/highlighter";
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

export const ChatView = () => {
  const form = useForm<ChatMessageFormData>({
    resolver: zodResolver(chatMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = (data: ChatMessageFormData) => {
    console.log("Message submitted:", data.message);
    // TODO: Implement message sending logic
    form.reset();
  };

  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center">
        <h4 className="max-w-md text-center text-xl font-bold">
          <Highlighter action="highlight" color="oklch(0.7853 0.1041 274.7134)">
            Ready to chat?
          </Highlighter>{" "}
          Let&apos;s{" "}
          <Highlighter action="underline" color="oklch(0.4836 0.0079 28.8785)">
            explore
          </Highlighter>{" "}
          together!
        </h4>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Just start typing your message in the box below and let&apos;s get
          this conversation going! 🚀
        </p>
      </section>
      <section className="w-full max-w-5xl">
        <div className="px-4 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="border-input bg-background focus-within:ring-ring flex flex-col rounded-md border px-4 py-4 focus-within:ring-2 focus-within:ring-offset-2">
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
                      </div>
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
