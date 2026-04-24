'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, Activity, CreditCard, LayoutGrid } from 'lucide-react';

const navigation = [
  { name: 'Accueil', href: '/dashboard', icon: Home },
  { name: 'Soldes', href: '/balances', icon: Landmark },
  { name: 'Tendances', href: '/trends', icon: Activity },
  { name: 'Dépenses', href: '/transactions', icon: CreditCard },
  { name: 'Catégories', href: '/categories', icon: LayoutGrid },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center pb-8 pt-4 px-4 bg-gradient-to-t from-black to-transparent pointer-events-none z-50 md:hidden">
      <div className="flex items-center justify-between w-full max-w-sm px-6 py-3 rounded-[32px] glass-card pointer-events-auto border border-white/10 shadow-2xl">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-premium
                ${isActive ? 'text-white' : 'text-[#8e8e93] hover:text-white/70'}
              `}
            >
              <item.icon size={20} className={isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.5px]'} />
              <span className="text-[9px] font-bold uppercase tracking-[0.05em]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
