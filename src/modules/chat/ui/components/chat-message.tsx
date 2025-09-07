"use client";

import { AVATAR_VARIANTS, cn, generateAvatar } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  type ComponentProps,
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
      <div {...props} className={cn("flex w-full flex-col py-2.5", className)}>
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
        "flex w-full items-start gap-x-2",
        variant === MESSAGE_VARIANTS.USER
          ? "flex-row justify-end"
          : "flex-row-reverse justify-start",
      )}
    >
      <Card
        {...props}
        className={cn(
          "px-4 py-2.5 shadow-sm",
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
      <Avatar className="mt-1.5 flex-shrink-0">
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

export type ChatMessageAuthorProps = HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactNode;
};

const ChatMessageAuthor = ({
  className,
  children,
  ...props
}: ChatMessageAuthorProps) => {
  const context = useContext(ChatMessageContext);
  if (!context) {
    throw new Error(
      "ChatMessageName must be used within a ChatMessage component",
    );
  }

  const { variant } = context;

  return (
    <span
      {...props}
      className={cn(
        "text-muted-foreground mb-1 text-xs font-medium",
        variant === MESSAGE_VARIANTS.USER ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </span>
  );
};

const ChatMessageError = ({
  children,
  className,
  ...props
}: ComponentProps<"span">) => {
  const context = useContext(ChatMessageContext);

  if (!context) {
    throw new Error(
      "ChatMessageName must be used within a ChatMessage component",
    );
  }

  return (
    <span className={cn("text-destructive mt-2 text-xs", className)} {...props}>
      {children}
    </span>
  );
};

export {
  MESSAGE_VARIANTS,
  ChatMessage,
  ChatMessageContent,
  ChatMessageAuthor,
  ChatMessageError,
};
