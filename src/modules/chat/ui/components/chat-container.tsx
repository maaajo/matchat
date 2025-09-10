import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

export const ChatContainer = ({
  children,
  className,
  ...props
}: ComponentProps<"div">) => {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-y-2 overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
};

export default ChatContainer;
