'use client';

import { useState, useEffect } from 'react';
import { getBankAccountsAction } from '@/app/actions/accounts';
import { syncTransactionsAction, getTransactionsAction } from '@/app/actions/bank';
import { RefreshCcw, ArrowRight, AlertCircle, ShoppingBag, Utensils, Zap, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([
      getBankAccountsAction(),
      getTransactionsAction()
    ]).then(([accounts, txs]) => {
      setBankAccounts(accounts || []);
      setTransactions(txs || []);
      setLoading(false);
    });
  }, []);

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const formattedTotal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Math.floor(totalBalance));
  const cents = (totalBalance % 1).toFixed(2).split('.')[1];
  
  // Stats pour les cartes
  const advances = transactions.filter(tx => tx.is_advance);
  const recentTx = transactions.slice(0, 2);
  
  const handleSync = async () => {
    setSyncing(true);
    await syncTransactionsAction();
    const [accounts, txs] = await Promise.all([getBankAccountsAction(), getTransactionsAction()]);
    setBankAccounts(accounts || []);
    setTransactions(txs || []);
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 px-1">
      {/* Header with Sync */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="p-2.5 rounded-full bg-white/5 text-[#8e8e93] hover:text-white transition-all active:scale-95"
        >
          <RefreshCcw size={16} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Total Balance Section */}
      <div className="flex flex-col items-center md:items-start animate-fade-in-up">
        <span className="text-[#8e8e93] text-sm font-bold uppercase tracking-[0.1em] mb-2">Tu as</span>
        <div className="flex items-baseline">
            <span className="text-3xl font-bold text-white mr-1">€</span>
            <h1 className="text-7xl font-bold tracking-tight text-white">
              {formattedTotal}
            </h1>
            {cents !== '00' && <span className="text-2xl font-bold text-[#8e8e93] ml-1">.{cents}</span>}
        </div>
      </div>

      {/* Accounts Mini List */}
      <div className="space-y-3 px-2 md:px-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {bankAccounts.map((acc) => (
          <div key={acc.id} className="flex justify-between items-center group max-w-sm">
            <span className="text-[#8e8e93] text-sm font-semibold group-hover:text-white transition-colors">
              {acc.bank_name || acc.name}
            </span>
            <span className="text-white text-sm font-bold">
              €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        
        {/* Card 1: 7 Days Spending */}
        <Link href="/transactions" className="bg-card rounded-[32px] p-5 space-y-4 hover:bg-card-hover transition-all border border-white/5 group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">7 derniers jours</span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <ArrowRight size={12} className="text-[#8e8e93] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-white">€342</span>
                <div className="flex items-center text-[#34d399] text-[10px] font-black bg-[#34d399]/10 px-1 rounded">
                    ↓ 12%
                </div>
            </div>
            <div className="flex items-end gap-1 h-10 pt-2">
                {[30, 50, 40, 70, 45, 90, 60].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-[3px] transition-all duration-500 delay-${i*50} ${i === 5 ? 'bg-accent-purple shadow-[0_0_10px_rgba(140,141,250,0.3)]' : 'bg-[#2c2c2e]'}`} style={{ height: `${h}%` }} />
                ))}
            </div>
            <div className="flex justify-between px-0.5 pt-1">
                {['F','S','S','M','T','W','T'].map(d => <span key={d} className="text-[8px] text-[#444] font-bold">{d}</span>)}
            </div>
          </div>
        </Link>

        {/* Card 2: Upcoming / Bill */}
        <div className="bg-card rounded-[32px] p-5 space-y-4 border border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">À Venir</span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <Plus size={12} className="text-[#8e8e93]" />
            </div>
          </div>
          <div className="space-y-3">
             <div className="space-y-0.5">
                <span className="text-white text-sm font-bold block truncate">Loyer Sim's</span>
                <div className="flex items-center gap-1.5 text-accent-yellow">
                    <AlertCircle size={12} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Aujourd'hui</span>
                </div>
             </div>
             <p className="text-2xl font-bold text-white">€812.27</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-accent-yellow/5 rounded-full blur-2xl group-hover:bg-accent-yellow/10 transition-all" />
        </div>

        {/* Card 3: Recent Activity */}
        <Link href="/transactions" className="bg-card rounded-[32px] p-5 space-y-4 hover:bg-card-hover transition-all border border-white/5 group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Récent</span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <ArrowRight size={12} className="text-[#8e8e93] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="space-y-3">
            {recentTx.length > 0 ? recentTx.map(tx => (
              <div key={tx.id} className="space-y-0.5">
                <span className="text-white text-[11px] font-bold block truncate">{tx.label}</span>
                <span className="text-[#8e8e93] text-[10px] font-medium">€{Math.abs(tx.amount).toFixed(2)}</span>
              </div>
            )) : <p className="text-[#8e8e93] text-[10px]">Aucune activité</p>}
          </div>
        </Link>

        {/* Card 4: Top Categories */}
        <Link href="/categories" className="bg-card rounded-[32px] p-5 space-y-4 hover:bg-card-hover transition-all border border-white/5 group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Catégories</span>
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <ArrowRight size={12} className="text-[#8e8e93] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
               <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center shadow-inner">
                  <ShoppingBag size={14} className="text-[#8e8e93]" />
               </div>
               <div className="flex flex-col min-w-0">
                    <span className="text-white text-[10px] font-bold truncate">Courses</span>
                    <span className="text-[#8e8e93] text-[9px] font-medium">€455</span>
               </div>
            </div>
            <div className="flex items-center gap-2.5">
               <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center shadow-inner">
                  <Utensils size={14} className="text-[#8e8e93]" />
               </div>
               <div className="flex flex-col min-w-0">
                    <span className="text-white text-[10px] font-bold truncate">Resto</span>
                    <span className="text-[#8e8e93] text-[9px] font-medium">€205</span>
               </div>
            </div>
          </div>
        </Link>

      </div>

      {/* Footer Branding or Action */}
      <div className="flex justify-center pt-4 opacity-20 grayscale scale-75">
         <div className="px-4 py-2 bg-white/10 rounded-full flex items-center gap-2">
            <Zap size={14} className="fill-white" />
            <span className="text-xs font-black uppercase tracking-widest">Power by DBA</span>
         </div>
      </div>
    </div>
  );
}
