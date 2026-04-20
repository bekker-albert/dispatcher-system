import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Диспетчерская система",
  description: "Рабочая система диспетчерской службы.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon-192.png",
    apple: "/app-icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Диспетчерская",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
