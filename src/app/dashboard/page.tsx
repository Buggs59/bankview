'use client';

import { useState, useEffect } from 'react';
import { getBankAccountsAction } from '@/app/actions/accounts';
import { syncTransactionsAction, getTransactionsAction } from '@/app/actions/bank';
import { RefreshCcw, ArrowRight, AlertCircle, Wallet, LayoutGrid, Calendar } from 'lucide-react';
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
  const formattedTotal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(totalBalance);
  
  // Stats pour les cartes
  const advances = transactions.filter(tx => tx.is_advance);
  const recentTx = transactions.slice(0, 3);
  
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
    <div className="space-y-10 pb-20">
      {/* Total Balance Section */}
      <div className="flex flex-col items-center pt-4 animate-fade-in-up">
        <div className="w-full flex justify-end">
             <button 
                onClick={handleSync}
                disabled={syncing}
                className="p-2 text-[#8e8e93] hover:text-white transition-colors"
                title="Synchroniser"
                >
                <RefreshCcw size={18} className={syncing ? 'animate-spin' : ''} />
            </button>
        </div>
        <span className="text-[#8e8e93] text-sm font-medium mb-1">Vous avez</span>
        <div className="flex items-start">
            <span className="text-3xl font-semibold mt-2 mr-1">€</span>
            <h1 className="text-7xl font-semibold tracking-tighter text-white">
            {formattedTotal}
            </h1>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {bankAccounts.map((acc) => (
          <div key={acc.id} className="flex justify-between items-center py-1 group">
            <span className="text-[#8e8e93] font-medium group-hover:text-white transition-colors">
              {acc.name}
            </span>
            <span className="text-white font-medium">
              €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        
        {/* Card 1: Last 7 Days (Mini Chart style) */}
        <Link href="/transactions" className="bg-[#1c1c1e] rounded-[28px] p-5 space-y-4 hover:bg-[#2c2c2e] transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-xs font-semibold uppercase tracking-wider">7 derniers jours</span>
            <ArrowRight size={14} className="text-[#8e8e93] group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">€342</span>
            <span className="text-[#34d399] text-[10px] font-bold">↓ 12%</span>
          </div>
          <div className="flex items-end gap-1 h-8">
            {[30, 50, 40, 70, 45, 90, 60].map((h, i) => (
              <div key={i} className="flex-1 bg-[#8c8dfa] rounded-t-[2px]" style={{ height: `${h}%` }} />
            ))}
          </div>
        </Link>

        {/* Card 2: Due Today / Alerts */}
        <div className="bg-[#1c1c1e] rounded-[28px] p-5 space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-white text-xs font-bold uppercase tracking-wider">À Venir</span>
            <ArrowRight size={14} className="text-[#8e8e93]" />
          </div>
          <div className="space-y-1">
             <div className="flex items-center gap-1.5 text-[#ffd60a]">
                <AlertCircle size={14} />
                <span className="text-xs font-bold">Prévu aujourd'hui</span>
             </div>
             <p className="text-lg font-bold text-white">€{advances.length > 0 ? Math.abs(advances[0].amount) : '0'}</p>
          </div>
          <p className="text-[#8e8e93] text-[10px]">~ €22.91 estimé</p>
        </div>

        {/* Card 3: Recent */}
        <Link href="/transactions" className="bg-[#1c1c1e] rounded-[28px] p-5 space-y-4 hover:bg-[#2c2c2e] transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-xs font-semibold uppercase tracking-wider">Récent</span>
            <ArrowRight size={14} className="text-[#8e8e93] group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-2">
            {recentTx.length > 0 ? recentTx.map(tx => (
              <div key={tx.id} className="flex justify-between text-[11px]">
                <span className="text-[#8e8e93] truncate max-w-[80px]">{tx.label}</span>
                <span className="text-white font-medium">€{Math.abs(tx.amount).toFixed(0)}</span>
              </div>
            )) : <p className="text-[#8e8e93] text-xs">Aucune transaction</p>}
          </div>
        </Link>

        {/* Card 4: Categories */}
        <Link href="/categories" className="bg-[#1c1c1e] rounded-[28px] p-5 space-y-4 hover:bg-[#2c2c2e] transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-[#8e8e93] text-xs font-semibold uppercase tracking-wider">Catégories</span>
            <ArrowRight size={14} className="text-[#8e8e93] group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded bg-[#8c8dfa]/20 flex items-center justify-center">
                  <Wallet size={10} className="text-[#8c8dfa]" />
               </div>
               <span className="text-white text-[11px] font-medium">Courses</span>
               <span className="ml-auto text-white text-[11px]">€455</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded bg-[#34d399]/20 flex items-center justify-center">
                  <LayoutGrid size={10} className="text-[#34d399]" />
               </div>
               <span className="text-white text-[11px] font-medium">Loisirs</span>
               <span className="ml-auto text-white text-[11px]">€380</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
