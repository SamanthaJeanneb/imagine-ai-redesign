import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { tokensToCss } from "@/styles/tokens";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Static: computed once per module load, not per request.
const tokenCss = tokensToCss();

export const metadata: Metadata = {
  title: "Imagine AI",
  description: "LinkedIn content agent for high-growth B2B teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style
          data-imagine-tokens=""
          dangerouslySetInnerHTML={{ __html: tokenCss }}
        />
        {/*
          Font Awesome Pro 7 Kit (SVG + JS). Loaded at browser idle so the kit
          never mutates deep page DOM that React is still hydrating.
          `nest` keeps the <i> React renders and puts the <svg> inside it.
        */}
        <Script
          src="https://kit.fontawesome.com/70369a3baa.js"
          crossOrigin="anonymous"
          strategy="lazyOnload"
          data-auto-replace-svg="nest"
        />
      </head>
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip">
        <ThemeProvider
          attribute="data-theme"
          storageKey="imagine-theme:v1"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
