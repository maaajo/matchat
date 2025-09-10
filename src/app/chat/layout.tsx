"use client";

import { ReactNode } from "react";
import { StickToBottom } from "@/components/stick-to-bottom";
import { ScrollToBottomButton } from "@/components/stick-to-bottom-button";

type ChatLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <StickToBottom className="h-dvh w-full" resize="smooth" initial="smooth">
      <StickToBottom.Content className="h-full">
        <main className="container mx-auto flex h-full w-full max-w-5xl flex-col items-center px-4 shadow-2xl">
          {children}
        </main>
      </StickToBottom.Content>
      <ScrollToBottomButton />
    </StickToBottom>
  );
}
