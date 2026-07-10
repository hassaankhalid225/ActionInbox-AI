import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider, themeScript } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "ActionInbox AI — Turn messy inbound into approved actions",
    template: "%s · ActionInbox AI",
  },
  description:
    "ActionInbox AI turns WhatsApp messages, voice notes, PDFs, and emails into structured, approval-ready business actions for small teams.",
  applicationName: "ActionInbox AI",
  keywords: ["AI inbox", "WhatsApp automation", "quotes", "invoices", "SMB", "action layer"],
  authors: [{ name: "ActionInbox AI" }],
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
