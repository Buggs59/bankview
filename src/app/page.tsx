'use client';

import { useState, useEffect } from 'react';
import { getBankAccountsAction } from '@/app/actions/accounts';
import { syncTransactionsAction, getTransactionsAction } from '@/app/actions/bank';
import { RefreshCcw, ArrowRight, AlertCircle, ShoppingBag, Utensils, Zap, Plus, TrendingUp, PieChart } from 'lucide-react';
import Link from 'next/link';
import CumulativeChart from '@/components/dashboard/CumulativeChart';
import FamilyPieChart from '@/components/dashboard/FamilyPieChart';

export default function Home() {
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
    <div className="space-y-12 pb-24">
      {/* Header with Sync */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="p-3 rounded-full bg-white/5 text-[#8e8e93] hover:text-white transition-all active:scale-95 border border-white/5 hover:border-white/10"
        >
          <RefreshCcw size={18} className={syncing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Total Balance Section */}
      <div className="flex flex-col items-center md:items-start animate-fade-in-up">
        <span className="text-[#8e8e93] text-sm font-black uppercase tracking-[0.2em] mb-4 opacity-60">Fortune Totale</span>
        <div className="flex items-baseline">
            <span className="text-4xl font-bold text-white mr-2 opacity-40">€</span>
            <h1 className="text-8xl font-black tracking-tighter text-white">
              {formattedTotal}
            </h1>
            {cents !== '00' && <span className="text-3xl font-bold text-[#8e8e93] ml-2 opacity-50">.{cents}</span>}
        </div>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {bankAccounts.map((acc) => (
          <div key={acc.id} className="flex justify-between items-center p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
            <div className="flex flex-col">
                <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Compte</span>
                <span className="text-white text-base font-bold group-hover:text-accent-purple transition-colors">
                {acc.bank_name || acc.name}
                </span>
            </div>
            <span className="text-white text-lg font-black tracking-tight">
              €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="xl:col-span-2">
          <CumulativeChart transactions={transactions} />
        </div>
        <div>
          <FamilyPieChart transactions={transactions} />
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        
        {/* Card 1: Upcoming / Bill */}
        <div className="bg-card/40 backdrop-blur-md rounded-[48px] p-10 space-y-8 border border-white/5 relative overflow-hidden group shadow-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.3em] opacity-60">Échéances</span>
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <Plus size={18} className="text-[#8e8e93]" />
            </div>
          </div>
          <div className="space-y-6 relative z-10">
             <div className="space-y-2">
                <span className="text-white text-xl font-bold block truncate tracking-tight">Flux à venir</span>
                <div className="flex items-center gap-3 text-accent-yellow">
                    <div className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse shadow-[0_0_10px_rgba(255,214,10,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{advances.length} Opérations</span>
                </div>
             </div>
             <p className="text-4xl font-black text-white tracking-tighter">€{advances.reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toFixed(0)}</p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-accent-yellow/5 rounded-full blur-[80px] group-hover:bg-accent-yellow/10 transition-all duration-1000" />
        </div>

        {/* Card 2: Recent Activity */}
        <Link href="/transactions" className="xl:col-span-2 bg-card/40 backdrop-blur-md rounded-[48px] p-10 space-y-8 hover:bg-card-hover transition-all border border-white/5 group shadow-2xl overflow-hidden relative">
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.3em] opacity-60">Activité Récente</span>
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <ArrowRight size={16} className="text-[#8e8e93] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {recentTx.length > 0 ? recentTx.map(tx => (
              <div key={tx.id} className="space-y-3 p-6 rounded-3xl bg-white/5 border border-white/5">
                <span className="text-white text-base font-bold block truncate tracking-tight">{tx.label}</span>
                <div className="flex items-center justify-between">
                    <span className={`text-sm font-black ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}€
                    </span>
                    <span className="text-[10px] text-[#8e8e93] font-bold uppercase tracking-widest opacity-60">
                      {new Date(tx.date_real).toLocaleDateString('fr-FR')}
                    </span>
                </div>
              </div>
            )) : <p className="text-[#8e8e93] text-sm italic opacity-40">Aucune activité</p>}
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent-purple/5 blur-[80px] rounded-full" />
        </Link>

        {/* Card 3: Total Fortune Detail */}
        <div className="bg-card/40 backdrop-blur-md rounded-[48px] p-10 space-y-8 border border-white/5 relative overflow-hidden group shadow-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.3em] opacity-60">Synthèse</span>
            <TrendingUp size={18} className="text-[#8e8e93]" />
          </div>
          <div className="space-y-2">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest block opacity-60">Solde Moyen</span>
            <p className="text-3xl font-black text-white tracking-tighter">€{Math.round(totalBalance / (bankAccounts.length || 1))}</p>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="flex justify-center pt-8 opacity-20 grayscale hover:opacity-40 transition-opacity">
         <div className="px-6 py-3 bg-white/5 rounded-full flex items-center gap-3 border border-white/10">
            <Zap size={16} className="fill-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Architectural Finance System</span>
         </div>
      </div>
    </div>
  );
}
