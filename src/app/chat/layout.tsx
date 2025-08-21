import { ReactNode } from "react";

type ChatLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <main className="container mx-auto flex min-h-dvh flex-col items-center px-4 shadow-2xl">
      {children}
    </main>
  );
}
