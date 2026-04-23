'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, LineChart, Wallet, LayoutGrid } from 'lucide-react';

const navigation = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Soldes', href: '/dashboard', icon: Landmark },
  { name: 'Tendances', href: '/trends', icon: LineChart },
  { name: 'Dépenses', href: '/transactions', icon: Wallet },
  { name: 'Catégories', href: '/categories', icon: LayoutGrid },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center pb-6 pt-4 px-4 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-50">
      <div className="flex items-center justify-between w-full max-w-md px-2">
        {navigation.map((item) => {
          // Si l'item href est la racine, vérifier exactement, sinon "includes"
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-300 ease-premium
                ${isActive 
                  ? 'text-white scale-105' 
                  : 'text-[#8e8e93] hover:text-white/80'}
              `}
            >
              <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'opacity-100' : 'opacity-0 translate-y-1'} transition-all duration-300 ease-premium`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
