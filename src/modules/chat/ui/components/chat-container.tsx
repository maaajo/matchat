"use client";

import { cn } from "@/lib/utils";
import { ArrowDownIcon } from "lucide-react";
import { ComponentProps } from "react";
import {
  StickToBottom,
  useStickToBottomContext,
  type StickToBottomProps,
} from "@/components/stick-to-bottom";
import { Button } from "@/components/ui/button";
import { ScrollToBottomButton } from "@/components/stick-to-bottom-button";

type ChatContainerProps = ComponentProps<"section"> &
  Pick<
    StickToBottomProps,
    "resize" | "initial" | "mass" | "damping" | "stiffness"
  > & {
    contentClassName?: ComponentProps<"section">["className"];
  };

export const ChatContainer = ({
  children,
  className,
  contentClassName,
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
        <StickToBottom.Content className={contentClassName}>
          {children}
        </StickToBottom.Content>

        <ScrollToBottomButton />
      </StickToBottom>
    </section>
  );
};
