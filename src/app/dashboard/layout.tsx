import TopNav from "@/components/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#ffffff] flex flex-col font-sans">
      <TopNav />
      <main className="flex-1 w-full max-w-lg mx-auto p-4 md:p-6 pb-24">
        {children}
      </main>
    </div>
  );
}
