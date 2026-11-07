import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getLocale } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loopback — feedback, in context",
  description: "Collect clear, useful feedback from the people using your product.",
};

export const viewport: Viewport = {
  themeColor: "#f8f7f2",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
