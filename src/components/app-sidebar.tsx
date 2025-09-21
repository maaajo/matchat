import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
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

// Menu items.
const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

type SidebarChatMenuProps = {
  data?: GetAllChatsOutput;
  isLoading: boolean;
};

const SidebarChatMenu = ({ data, isLoading }: SidebarChatMenuProps) => {
  if (!data) {
    return null;
  }

  if (isLoading) {
    return <p>Loading</p>;
  }

  return (
    <SidebarMenu>
      {data.map(chat => {
        return (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton asChild className="px-2.5">
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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarChatMenu isLoading={isLoading} data={data} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
