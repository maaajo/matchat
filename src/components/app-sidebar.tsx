import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { GetAllChatsOutput } from "@/modules/chat/server/types";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SidebarChatMenuProps = {
  data?: GetAllChatsOutput;
  isLoading: boolean;
};

const SidebarChatMenu = ({ data, isLoading }: SidebarChatMenuProps) => {
  const pathname = usePathname();
  if (isLoading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 20 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton className="pointer-events-none px-2.5">
              <div className="flex w-full flex-row items-center justify-between gap-x-2">
                <Skeleton className="h-5 w-full" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      {data.map(chat => {
        const isActive = pathname?.includes(chat.id) ?? false;
        return (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton
              asChild
              className={cn(
                "px-2.5",
                `${isActive ? "pointer-events-none" : null}`,
              )}
              isActive={isActive}
            >
              <Link
                href={`/chat/${chat.id}`}
                className="flex flex-row justify-between gap-x-2"
              >
                <span>{chat.title}</span>
                {chat.isStreaming ? (
                  <span>
                    <Loader variant="circular" size="sm" />
                  </span>
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

export function AppSidebar() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.chat.getAllByUserId.queryOptions());

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row justify-between px-4">
        MatChat
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarChatMenu isLoading={isLoading} data={data} />
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
