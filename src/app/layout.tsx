import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { siteConfig } from "@/config/site";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetBrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta name="darkreader-lock" content="true" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
