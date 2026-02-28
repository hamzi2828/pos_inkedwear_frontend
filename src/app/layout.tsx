// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import '@fortawesome/fontawesome-free/css/all.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inked Wear",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 min-h-screen`} suppressHydrationWarning>
        <Toaster position="top-center" />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}