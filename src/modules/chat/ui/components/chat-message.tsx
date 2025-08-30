"use client";

import { AVATAR_VARIANTS, cn, generateAvatar } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  ComponentProps,
  createContext,
  HTMLAttributes,
  useContext,
} from "react";

const MESSAGE_VARIANTS = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

type ChatMessageContextValue = {
  variant: (typeof MESSAGE_VARIANTS)[keyof typeof MESSAGE_VARIANTS];
};

const ChatMessageContext = createContext<ChatMessageContextValue | null>(null);

export type ChatMessageProps = HTMLAttributes<HTMLDivElement> & {
  variant: (typeof MESSAGE_VARIANTS)[keyof typeof MESSAGE_VARIANTS];
  userName?: string;
};

const ChatMessage = ({
  variant,
  userName,
  className,
  children,
  ...props
}: ChatMessageProps) => {
  return (
    <ChatMessageContext.Provider value={{ variant }}>
      <div
        {...props}
        className={cn(
          "flex w-full gap-x-2",
          variant === MESSAGE_VARIANTS.USER ? "justify-end" : "justify-start",
          variant === MESSAGE_VARIANTS.USER ? "flex-row" : "flex-row-reverse",
          className,
        )}
      >
        <div
          className={cn(
            "max-w-[80%] md:max-w-[70%]",
            variant === MESSAGE_VARIANTS.USER ? "ml-auto" : "mr-auto",
          )}
        >
          {children}
        </div>
        <Avatar className="mt-1">
          <AvatarImage
            src={generateAvatar({
              seed:
                variant === MESSAGE_VARIANTS.USER
                  ? (userName ?? "")
                  : "assistant",
              variant:
                variant === MESSAGE_VARIANTS.USER
                  ? AVATAR_VARIANTS.INITIALS
                  : AVATAR_VARIANTS.BOTTTS,
            }).toDataUri()}
          />
        </Avatar>
      </div>
    </ChatMessageContext.Provider>
  );
};

export type ChatMessageContentProps = ComponentProps<typeof Card>;

const ChatMessageContent = ({
  className,
  children,
  ...props
}: ChatMessageContentProps) => {
  const context = useContext(ChatMessageContext);
  if (!context) {
    throw new Error(
      "ChatMessageContent must be used within a ChatMessage component",
    );
  }

  const { variant } = context;

  return (
    <Card
      {...props}
      className={cn(
        "px-4 py-2 shadow-sm",
        variant === MESSAGE_VARIANTS.USER ? "border-primary" : "border-muted",
        className,
      )}
    >
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{children}</p>
    </Card>
  );
};

export { MESSAGE_VARIANTS, ChatMessage, ChatMessageContent };
