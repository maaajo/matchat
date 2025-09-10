"use client";

import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

type ChatContainerProps = ComponentProps<"section"> & {
  contentClassName?: ComponentProps<"section">["className"];
};

export const ChatContainer = ({
  children,
  className,
  contentClassName,
  ...props
}: ChatContainerProps) => {
  return (
    <section
      className={cn("relative flex min-h-0 flex-1 flex-col", className)}
      {...props}
    >
      <div className={contentClassName}>{children}</div>
    </section>
  );
};
