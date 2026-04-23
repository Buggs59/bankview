import BottomNav from "@/components/BottomNav";

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#ffffff] flex flex-col font-sans selection:bg-[#8c8dfa]/30">
      <main className="flex-1 w-full max-w-md mx-auto p-4 md:p-6 pb-32">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
