import { getIsSignedInServer } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInView } from "@/modules/auth/ui/views/sign-in-view";

export default async function SignInPage() {
  const isSignedIn = await getIsSignedInServer();

  if (isSignedIn) {
    redirect("/");
  }

  return <SignInView />;
}
