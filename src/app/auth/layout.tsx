import { ReactNode } from "react";
import { AuthLayout } from "@/modules/auth/ui/layout";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: AuthLayoutProps) {
  return <AuthLayout>{children}</AuthLayout>;
}
