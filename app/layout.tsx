import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcon GPT",
  description: "AI ChatBot für IT-Supports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme = "dark" className="font-sans tracking-wide bg-arcon-green">
      <body className="bg-arcon-green">{children}</body>
    </html>
  );
}
