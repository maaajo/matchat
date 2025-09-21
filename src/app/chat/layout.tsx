"use client";

import { ReactNode } from "react";
import { StickToBottom } from "@/components/stick-to-bottom";
import { ScrollToBottomButton } from "@/components/stick-to-bottom-button";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type ChatLayoutProps = Readonly<{
  children: ReactNode;
}>;

function FloatingTrigger() {
  const { open } = useSidebar();

  if (open) return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <SidebarTrigger />
    </div>
  );
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh">
        <FloatingTrigger />
        <StickToBottom
          className="min-h-0 w-full flex-1"
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
