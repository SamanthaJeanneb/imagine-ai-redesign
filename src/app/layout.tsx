import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Imagine AI",
  description: "LinkedIn content agent for high-growth B2B teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
