import { auth } from "@/lib/auth";
import { config } from "@/lib/config";
import { ChatViewContainer } from "@/modules/chat/ui/views/chat-view-container";
import { ChatViewLoading } from "@/modules/chat/ui/views/chat-view-loading";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type ChatIdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.chat.getOne.queryOptions({ id }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ChatViewLoading />}>
        <ChatViewContainer chatId={id} userName={session.user.name} />
      </Suspense>
    </HydrationBoundary>
  );
}

export async function generateMetadata({ params }: ChatIdPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();
  const chat = await queryClient.ensureQueryData(
    trpc.chat.getOne.queryOptions({ id }),
  );

  return {
    title: `${chat.title} - ${config.appName}`,
  };
}
