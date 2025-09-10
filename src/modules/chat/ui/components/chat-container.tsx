"use client";

import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

type ChatContainerProps = ComponentProps<"section">;

export const ChatContainer = ({
  children,
  className,
  ...props
}: ChatContainerProps) => {
  return (
    <section
      className={cn("relative flex min-h-0 flex-1 flex-col", className)}
      {...props}
    >
      {children}
    </section>
  );
};
