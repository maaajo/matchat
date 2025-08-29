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
      className={cn(
        "flex flex-1 flex-col items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
};

export default ChatContainer;
