import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#ffffff] flex font-sans selection:bg-[#8c8dfa]/30">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-12 pb-32 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
