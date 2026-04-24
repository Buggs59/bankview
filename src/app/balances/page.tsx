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
    <div className="space-y-8 pb-32 pt-4 px-1">
      
      <div className="flex flex-col lg:flex-row-reverse gap-12 items-start">
        
        {/* Net Worth Summary - Sticky on Desktop */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-purple/10 blur-[80px] rounded-full" />
             
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-accent-purple">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Patrimoine Net</span>
                    </div>
                    <div className="px-2 py-0.5 bg-accent-green/10 text-accent-green text-[9px] font-black rounded-full border border-accent-green/20">
                        STABLE
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-5xl font-bold text-white tracking-tight">
                        €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Math.floor(totalBalance))}
                        <span className="text-2xl text-[#444]">.{(totalBalance % 1).toFixed(2).split('.')[1]}</span>
                    </h2>
                    <div className="flex items-center gap-2 text-[#8e8e93] text-xs font-semibold">
                        <div className="flex items-center gap-1 text-accent-green">
                            <TrendingUp size={14} />
                            <span>+2.4%</span>
                        </div>
                        <span className="opacity-40">vs mois dernier</span>
                    </div>
                </div>
             </div>
           </div>

           {/* Security Info */}
           <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                 <ShieldCheck size={20} className="text-[#8e8e93]" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-white text-xs font-bold uppercase tracking-wide">Comptes Protégés</h4>
                 <p className="text-[#8e8e93] text-[11px] leading-relaxed">
                    Tes données sont synchronisées via Enable Banking avec un chiffrement de bout en bout.
                 </p>
              </div>
           </div>
        </div>

        {/* Accounts List */}
        <div className="flex-1 space-y-10 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center px-2">
                 <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.2em]">Mes Comptes</h3>
                 <button className="text-accent-purple text-xs font-bold hover:underline">Gérer</button>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                    {bankAccounts.map((acc) => (
                    <div 
                        key={acc.id} 
                        className="flex items-center gap-5 p-5 rounded-[32px] bg-card/50 hover:bg-card hover:border-white/10 transition-all border border-white/5 group active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-card border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Landmark size={24} className="text-[#8e8e93] group-hover:text-accent-purple transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white text-base font-bold truncate">{acc.name}</h3>
                            <p className="text-[#8e8e93] text-[11px] font-semibold uppercase tracking-wider">{acc.bank_name || 'Compte Courant'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white text-lg font-black tracking-tight">€{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}</p>
                            <div className="flex justify-end mt-1">
                                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                                    <ArrowRight size={10} className="text-[#444] group-hover:text-accent-purple transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Investments Placeholder */}
                <div className="pt-8 space-y-4 opacity-40">
                    <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.2em] px-2">Investissements (Bientôt)</h3>
                    <div className="p-8 rounded-[40px] bg-card/30 border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <Wallet size={24} className="text-[#444]" />
                        </div>
                        <div>
                            <p className="text-white/60 text-sm font-bold">Bientôt disponible</p>
                            <p className="text-[#444] text-[11px]">Suis tes actions et cryptos directement ici.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
