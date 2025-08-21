"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { SiGithub } from "@icons-pack/react-simple-icons";

export const SignInView = () => {
  const [isAuthPending, setIsAuthPending] = useState(false);

  const handleSignInWithGithub = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/chat",
      fetchOptions: {
        onRequest: () => {
          setIsAuthPending(true);
        },
        onSuccess: () => {
          setIsAuthPending(false);
          toast.success("Successfully logged in, redirecting to /chat");
        },
        onError: ctx => {
          setIsAuthPending(false);
          toast.error(`Something went wrong: ${ctx.error.message}`);
        },
      },
    });
  };

  return (
    <Button
      onClick={handleSignInWithGithub}
      variant="outline"
      className="px-6 py-6 text-base font-bold"
      isLoading={isAuthPending}
    >
      <SiGithub />
      Sign in with GitHub
    </Button>
  );
};
