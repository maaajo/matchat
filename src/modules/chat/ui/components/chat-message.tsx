import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const MESSAGE_VARIANTS = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

type ChatMessageContextValue = {
  variant: (typeof MESSAGE_VARIANTS)[keyof typeof MESSAGE_VARIANTS];
};

const ChatMessageContext = React.createContext<ChatMessageContextValue | null>(
  null,
);

export type ChatMessageProps = React.HTMLAttributes<HTMLDivElement> & {
  variant: (typeof MESSAGE_VARIANTS)[keyof typeof MESSAGE_VARIANTS];
};

const ChatMessage = ({
  variant,
  className,
  children,
  ...props
}: ChatMessageProps) => {
  return (
    <ChatMessageContext.Provider value={{ variant }}>
      <div
        {...props}
        className={cn(
          "flex w-full",
          variant === MESSAGE_VARIANTS.USER ? "justify-end" : "justify-start",
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
      </div>
    </ChatMessageContext.Provider>
  );
};

export type ChatMessageContentProps = React.ComponentProps<typeof Card>;

const ChatMessageContent = ({
  className,
  children,
  ...props
}: ChatMessageContentProps) => {
  const context = React.useContext(ChatMessageContext);
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
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </Card>
  );
};

export { MESSAGE_VARIANTS, ChatMessage, ChatMessageContent };
