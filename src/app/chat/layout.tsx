"use client";

import { ReactNode } from "react";
import { StickToBottom } from "@/components/stick-to-bottom";
import { ScrollToBottomButton } from "@/components/stick-to-bottom-button";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type ChatLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex items-center gap-2 px-4 py-2">
          <SidebarTrigger />
        </div>
        <StickToBottom
          className="w-full flex-1"
          resize="smooth"
          initial="smooth"
        >
          <StickToBottom.Content className="pb-48">
            <main className="container mx-auto flex h-full w-full max-w-5xl flex-col items-center px-4 shadow-2xl">
              {children}
            </main>
          </StickToBottom.Content>
          <ScrollToBottomButton />
        </StickToBottom>
      </SidebarInset>
    </SidebarProvider>
  );
}
