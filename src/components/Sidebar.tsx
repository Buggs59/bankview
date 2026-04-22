'use client';

import { 
  LayoutDashboard, 
  Settings, 
  ArrowLeftRight, 
  Menu,
  X,
  LogOut 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signout } from '@/app/auth/actions';


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-md text-slate-400"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar background overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <div className={`
        fixed left-0 top-0 bottom-0 z-40 w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col
        transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="mb-10 px-2">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm italic">DBA</span>
            Budget Architect
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'}
                `}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-xs text-slate-500 mb-1 font-medium italic">Connected as</p>
            <p className="text-sm text-slate-300 truncate font-semibold">Administrator</p>
          </div>
          
          <button
            onClick={() => signout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all group"
          >
            <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            Déconnexion
          </button>
        </div>

      </div>
    </>
  );
}
