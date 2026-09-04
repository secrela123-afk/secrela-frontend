import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { APP_NAME } from "../lib/brand";
import { QueryProvider } from "../providers/QueryProvider";
import { ToastHost } from "../components/ui/ToastHost";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Secure company secrets, access control, and security intelligence.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background-primary font-sans text-text-primary">
        <QueryProvider>
          <ToastHost />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
