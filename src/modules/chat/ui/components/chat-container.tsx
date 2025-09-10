"use client";

import { cn } from "@/lib/utils";
import { ArrowDownCircle } from "lucide-react";
import { ComponentProps } from "react";
import {
  StickToBottom,
  useStickToBottomContext,
  type StickToBottomProps,
} from "@/components/stick-to-bottom";

type ChatContainerProps = ComponentProps<"section"> &
  Pick<
    StickToBottomProps,
    "resize" | "initial" | "mass" | "damping" | "stiffness"
  >;

export const ChatContainer = ({
  children,
  className,
  resize = "smooth",
  initial = "smooth",
  mass,
  damping,
  stiffness,
  ...props
}: ChatContainerProps) => {
  return (
    <section
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
      {...props}
    >
      <StickToBottom
        className="relative h-full min-h-0 w-full"
        resize={resize}
        initial={initial}
        mass={mass}
        damping={damping}
        stiffness={stiffness}
      >
        <StickToBottom.Content>{children}</StickToBottom.Content>

        <ScrollToBottomButton />
      </StickToBottom>
    </section>
  );
};

function ScrollToBottomButton() {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <button
      type="button"
      className="bg-background/80 ring-border hover:bg-background absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full p-1 shadow-md ring-1"
      onClick={() => scrollToBottom()}
      aria-label="Scroll to bottom"
    >
      <ArrowDownCircle className="h-7 w-7" />
    </button>
  );
}

export default ChatContainer;
