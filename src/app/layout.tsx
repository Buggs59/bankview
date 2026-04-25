import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Denis Budget Architect",
  description: "DBA - Votre architecte financier personnel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-[#050505] text-[#ffffff] flex font-sans selection:bg-[#8c8dfa]/30">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

import { headers } from 'next/headers';

async function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAuthPage = pathname.includes('/login');

  if (isAuthPage) {
    return (
      <div className="flex-1 flex flex-col w-full">
        <main className="flex-1 w-full flex items-center justify-center p-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-12 pb-32 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </div>
    </>
  );
}
