"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { ChatContainer } from "@/modules/chat/ui/components/chat-container";

type ChatViewLoadingProps = {
  messageCount?: number;
};

export const ChatViewLoading = ({ messageCount = 3 }: ChatViewLoadingProps) => {
  return (
    <>
      <ChatContainer className="flex w-full flex-col items-center justify-start gap-y-2 px-4 pt-12">
        {/* Chat title skeleton */}
        <div className="text-secondary-foreground bg-secondary shadow-secondary rounded-md px-3 py-1.5 text-xs shadow-lg">
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Messages skeleton */}
        <div className="flex w-full flex-col gap-y-2 pt-4">
          {Array.from({ length: messageCount }).map((_, index) => {
            const isUser = index % 2 === 0;

            return (
              <div key={index} className="flex w-full flex-col py-2.5">
                {/* Author name skeleton */}
                <div
                  className={`text-muted-foreground mb-1 text-xs font-medium ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  <Skeleton className="ml-auto h-3 w-16" />
                </div>

                {/* Message content skeleton */}
                <div
                  className={`flex w-full items-start gap-x-2 ${
                    isUser
                      ? "flex-row justify-end"
                      : "flex-row-reverse justify-start"
                  }`}
                >
                  <Card
                    className={`px-4 py-2.5 shadow-sm ${
                      isUser ? "border-primary ml-auto" : "border-muted mr-auto"
                    }`}
                  >
                    <div className="space-y-1 text-sm leading-relaxed whitespace-pre-wrap">
                      <Skeleton className="h-4 w-full max-w-md" />
                      {index % 3 === 0 && <Skeleton className="h-4 w-3/4" />}
                      {index % 4 === 0 && <Skeleton className="h-4 w-1/2" />}
                    </div>
                  </Card>

                  {/* Avatar skeleton */}
                  <Avatar className="mt-1.5 flex-shrink-0">
                    <Skeleton className="h-full w-full rounded-full" />
                  </Avatar>
                </div>
              </div>
            );
          })}
        </div>
      </ChatContainer>

      {/* Input form skeleton */}
      <section className="fixed right-0 bottom-0 left-0 z-50">
        <div className="container mx-auto w-full max-w-5xl px-4 py-4 pt-2">
          <Card className="border-input bg-background/20 relative flex flex-col overflow-hidden rounded-md border px-4 py-4 backdrop-blur-lg">
            {/* Textarea skeleton */}
            <div className="mb-3 min-h-[44px] flex-1">
              <Skeleton className="h-11 w-full" />
            </div>

            {/* Send button skeleton */}
            <div className="flex justify-end">
              <Skeleton className="h-9 w-16" />
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};
