import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const SidebarChatSkeleton = () => {
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
};

export function AppSidebar() {
  const trpc = useTRPC();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(trpc.chat.getAllByUserId.queryOptions());
  const handleDelete = useMutation(trpc.chat.delete.mutationOptions());

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
              {(!data || data.length === 0) && null}
              {isLoading ? <SidebarChatSkeleton /> : null}
              {data && (
                <SidebarMenu>
                  {data.map(chat => {
                    const isActive = pathname?.includes(chat.id) ?? false;
                    return (
                      <SidebarMenuItem key={chat.id}>
                        <div className="group/item hover:bg-accent/50 flex w-full items-center rounded-md">
                          <SidebarMenuButton
                            asChild
                            className="flex-1 px-2.5"
                            isActive={isActive}
                          >
                            <Link
                              href={`/chat/${chat.id}`}
                              className={cn(
                                "flex flex-row items-center justify-between",
                                isActive ? "pointer-events-none" : null,
                              )}
                            >
                              <span className="truncate">{chat.title}</span>
                              {chat.isStreaming ? (
                                <Loader variant="circular" size="sm" />
                              ) : null}
                            </Link>
                          </SidebarMenuButton>
                          {chat.title && !chat.isStreaming ? (
                            <Button
                              className="ml-1 size-6 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100"
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                handleDelete.mutate(
                                  { id: chat.id },
                                  {
                                    onSuccess: () => {
                                      queryClient.invalidateQueries(
                                        trpc.chat.getAllByUserId.queryOptions(),
                                      );
                                      if (isActive) {
                                        router.replace(`/chat`);
                                      }
                                    },
                                  },
                                );
                              }}
                            >
                              <XIcon className="size-3" />
                            </Button>
                          ) : null}
                        </div>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
