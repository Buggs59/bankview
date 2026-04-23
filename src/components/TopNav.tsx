'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signout } from '@/app/auth/actions';
import { LogOut } from 'lucide-react';

const navigation = [
  { name: 'Balances', href: '/dashboard' },
  { name: 'Spending', href: '/transactions' },
  { name: 'Settings', href: '/settings' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="flex items-center gap-1 bg-[#1c1c1e] p-1.5 rounded-full shadow-lg border border-white/5">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${isActive 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-[#8e8e93] hover:text-white'}
              `}
            >
              {item.name}
            </Link>
          );
        })}
        <div className="w-[1px] h-6 bg-white/10 mx-2" />
        <button
          onClick={() => signout()}
          className="p-2.5 rounded-full text-[#8e8e93] hover:text-white hover:bg-white/10 transition-colors"
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
