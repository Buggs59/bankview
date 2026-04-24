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
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
          <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-12 pb-32 md:pb-12">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
