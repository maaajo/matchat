"use client";

import { AVATAR_VARIANTS, cn, generateAvatar } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import React, {
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
  userName?: string;
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
    <ChatMessageContext.Provider value={{ variant, userName }}>
      <div {...props} className={cn("flex w-full flex-col", className)}>
        {children}
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

  const { variant, userName } = context;

  return (
    <div
      className={cn(
        "flex w-full items-center gap-x-2",
        variant === MESSAGE_VARIANTS.USER
          ? "flex-row justify-end"
          : "flex-row-reverse justify-start",
      )}
    >
      <Card
        {...props}
        className={cn(
          "max-w-[80%] px-4 py-2 shadow-sm md:max-w-[70%]",
          variant === MESSAGE_VARIANTS.USER
            ? "border-primary ml-auto"
            : "border-muted mr-auto",
          className,
        )}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      </Card>
      <Avatar className="flex-shrink-0">
        <AvatarImage
          src={generateAvatar({
            seed:
              variant === MESSAGE_VARIANTS.USER ? userName || "" : "assistant",
            variant:
              variant === MESSAGE_VARIANTS.USER
                ? AVATAR_VARIANTS.INITIALS
                : AVATAR_VARIANTS.BOTTTS,
          }).toDataUri()}
          alt={
            variant === MESSAGE_VARIANTS.USER
              ? `Avatar for ${userName || "user"}`
              : "Assistant avatar"
          }
        />
      </Avatar>
    </div>
  );
};

export type ChatMessageNameProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const ChatMessageName = ({
  className,
  children,
  ...props
}: ChatMessageNameProps) => {
  const context = useContext(ChatMessageContext);
  if (!context) {
    throw new Error(
      "ChatMessageName must be used within a ChatMessage component",
    );
  }

  const { variant } = context;

  return (
    <div
      {...props}
      className={cn(
        "text-muted-foreground mb-1 text-xs font-medium",
        variant === MESSAGE_VARIANTS.USER ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </div>
  );
};

export { MESSAGE_VARIANTS, ChatMessage, ChatMessageContent, ChatMessageName };
