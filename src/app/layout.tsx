import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";
import { TRPCReactProvider } from "@/trpc/client";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatChat",
  description:
    "Demo chat app to learn how to integrate with AI and build chatbots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${jetBrainsMono.variable}`}
      >
        <body className={`bg-background antialiased`}>
          <Providers>
            {children}
            <Toaster position="top-center" />
          </Providers>
        </body>
      </html>
    </TRPCReactProvider>
  );
}
