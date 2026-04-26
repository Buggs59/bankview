'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, Activity, CreditCard, LayoutGrid, Zap, Settings } from 'lucide-react';

const navigation = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Soldes', href: '/balances', icon: Landmark },
  { name: 'Tendances', href: '/trends', icon: Activity },
  { name: 'Dépenses', href: '/transactions', icon: CreditCard },
  { name: 'Catégories', href: '/categories', icon: LayoutGrid },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background border-r border-white/5 p-6 z-50">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 rounded-xl bg-accent-purple flex items-center justify-center shadow-[0_0_15px_rgba(140,141,250,0.4)]">
            <Zap size={20} className="text-white fill-white" />
        </div>
        <span className="font-black text-xl tracking-tighter text-white uppercase">Bankview</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-white/5 text-white shadow-inner' 
                  : 'text-[#8e8e93] hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon 
                size={22} 
                className={`transition-transform duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.5px] group-hover:scale-110'}`} 
              />
              <span className={`text-xs font-black uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple shadow-[0_0_8px_rgba(140,141,250,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5 opacity-30 mt-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8e8e93]">Version 2.0.0</p>
        <p className="text-[9px] font-medium text-[#444]">Designed by Antigravity</p>
      </div>
    </div>
  );
}
