import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

export const ChatContainer = ({
  children,
  className,
  ...props
}: ComponentProps<"div">) => {
  return (
    <section
      className={cn("flex flex-1 flex-col gap-y-2", className)}
      {...props}
    >
      {children}
    </section>
  );
};

export default ChatContainer;
