import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CenterIT",
  description: "Zentrales Homelab-Dashboard für lokale Dienste",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased dark">
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
