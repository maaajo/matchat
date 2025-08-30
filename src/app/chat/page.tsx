import { auth } from "@/lib/auth";
import { ChatView } from "@/modules/chat/ui/views/chat-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }

  return <ChatView userName={session.user.name} />;
}
