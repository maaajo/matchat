import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type ChatContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export const ChatContainer = ({
  children,
  className,
  ...props
}: ChatContainerProps) => {
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
