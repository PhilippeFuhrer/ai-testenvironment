import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcon GPT ",
  description: "AI ChatBot für IT-Supports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme = "dark" className="bg-arcon-green font-sans tracking-wide">
      <body>{children}</body>
    </html>
  );
}
