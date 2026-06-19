import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CenterIT",
  description: "Self-hosted Dashboard für lokale Dienste im Homelab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
