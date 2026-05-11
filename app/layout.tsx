import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wally Food Tracker 🍼",
  description: "Track foods offered and reactions for your little one",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
