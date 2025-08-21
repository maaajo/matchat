import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {children}
    </main>
  );
};
