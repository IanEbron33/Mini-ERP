import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Mini-ERP Dashboard | Data Analytics",
  description: "High-level summary with KPI cards and performance analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#fff7e8] text-[#341100] min-h-screen">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

