'use client';

import { useState, useEffect } from 'react';
import { getBankAccountsAction } from '@/app/actions/accounts';
import { Landmark, ArrowRight, Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

export default function BalancesPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBankAccountsAction().then((accounts) => {
      setBankAccounts(accounts || []);
      setLoading(false);
    });
  }, []);

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="pt-8 px-2 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-1">Soldes</h1>
        <p className="text-[#8e8e93] text-sm font-medium">Tes comptes bancaires synchronisés</p>
      </div>

      {/* Net Worth Card */}
      <div className="bg-card rounded-[32px] p-6 mx-2 border border-white/5 billiard-gradient animate-fade-in-up" style={{ animationDelay: '100ms' }}>
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-accent-purple">
                <ShieldCheck size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Valeur Nette</span>
            </div>
            <div className="px-2 py-1 bg-accent-green/10 text-accent-green text-[10px] font-black rounded-full">
                STABLE
            </div>
         </div>
         <div className="space-y-1">
            <span className="text-4xl font-bold text-white">
                €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(totalBalance)}
            </span>
            <div className="flex items-center gap-1.5 text-[#8e8e93] text-xs font-medium">
                <TrendingUp size={14} className="text-accent-green" />
                <span>+2.4% par rapport au mois dernier</span>
            </div>
         </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-6 px-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="space-y-4">
            <h2 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest px-2">Banques & Comptes</h2>
            <div className="space-y-2">
                {bankAccounts.map((acc) => (
                <div 
                    key={acc.id} 
                    className="flex items-center gap-4 p-4 rounded-[24px] bg-card/50 hover:bg-card transition-colors border border-white/5 group"
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Landmark size={20} className="text-[#8e8e93] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-bold truncate">{acc.name}</h3>
                        <p className="text-[#8e8e93] text-xs font-medium">{acc.bank_name || 'Compte Courant'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-white text-sm font-bold">€{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}</p>
                        <ArrowRight size={12} className="ml-auto mt-1 text-[#444] group-hover:text-white transition-colors" />
                    </div>
                </div>
                ))}
            </div>
        </div>

        {/* Dummy Savings Section for UI completeness */}
        <div className="space-y-4 opacity-50">
            <h2 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest px-2">Investissements</h2>
            <div className="p-4 rounded-[24px] bg-card/30 border border-dashed border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Wallet size={20} className="text-[#444]" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#444] text-sm font-bold">Ajouter un compte</h3>
                    <p className="text-[#444] text-xs font-medium">Actions, Crypto, Immo</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
