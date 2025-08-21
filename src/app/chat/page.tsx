import { getIsSignedInServer } from "@/lib/auth";
import { ChatView } from "@/modules/chat/ui/views/chat-view";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const isSignedIn = await getIsSignedInServer();

  if (!isSignedIn) {
    redirect("/auth/sign-in");
  }

  return <ChatView />;
}
