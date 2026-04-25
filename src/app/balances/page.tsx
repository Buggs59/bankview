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

  const totalBalance: number = bankAccounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
  return (
    <div className="space-y-12 pb-32 pt-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-16 items-start w-full">
        
        {/* Accounts List */}
        <div className="order-2 xl:order-1 flex-1 space-y-12 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center px-4">
                 <h3 className="text-[#8e8e93] text-sm font-black uppercase tracking-[0.3em] opacity-60">Mes Comptes Bancaires</h3>
                 <button className="text-accent-purple text-xs font-black uppercase tracking-[0.1em] hover:opacity-70 transition-opacity">Gérer les connexions</button>
            </div>

            <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {bankAccounts.map((acc) => (
                    <div 
                        key={acc.id} 
                        className="flex items-center gap-6 p-8 rounded-[40px] bg-card/40 backdrop-blur-md hover:bg-card hover:border-white/10 transition-all border border-white/5 group active:scale-[0.98] shadow-lg"
                    >
                        <div className="w-20 h-20 rounded-[28px] bg-black/40 border border-white/5 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all group-hover:border-accent-purple/30">
                            <Landmark size={32} className="text-[#8e8e93] group-hover:text-accent-purple transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white text-xl font-bold truncate tracking-tight">{acc.name}</h3>
                            <p className="text-[#8e8e93] text-[11px] font-black uppercase tracking-[0.1em] opacity-40 mt-1">{acc.bank_name || 'Établissement Bancaire'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white text-2xl font-black tracking-tighter">€{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}</p>
                            <div className="flex justify-end mt-2">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors border border-white/5">
                                    <ArrowRight size={14} className="text-[#444] group-hover:text-accent-purple transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Investments Section */}
                <div className="pt-12 space-y-8">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-[#8e8e93] text-sm font-black uppercase tracking-[0.3em] opacity-60">Investissements</h3>
                        <span className="px-3 py-1 bg-accent-purple/10 text-accent-purple text-[10px] font-black rounded-full border border-accent-purple/20">NOUVEAU</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-12 rounded-[48px] bg-card/20 border border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-6 group hover:border-white/10 transition-all">
                            <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                                <TrendingUp size={32} className="text-[#444] group-hover:text-accent-green transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white text-lg font-bold">Bourse & Cryptos</p>
                                <p className="text-[#8e8e93] text-xs font-medium max-w-[200px] leading-relaxed">Suis tes actifs financiers en temps réel.</p>
                            </div>
                            <button className="px-6 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8e8e93] hover:bg-white hover:text-black transition-all">Activer</button>
                        </div>

                        <div className="p-12 rounded-[48px] bg-card/20 border border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-6 group hover:border-white/10 transition-all">
                            <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                                <Wallet size={32} className="text-[#444] group-hover:text-accent-purple transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white text-lg font-bold">Immobilier</p>
                                <p className="text-[#8e8e93] text-xs font-medium max-w-[200px] leading-relaxed">Intègre ton patrimoine immobilier complet.</p>
                            </div>
                            <button className="px-6 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8e8e93] hover:bg-white hover:text-black transition-all">Ajouter</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Net Worth Summary */}
        <div className="order-1 xl:order-2 w-full xl:sticky xl:top-12 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[48px] p-12 border border-white/5 space-y-12 shadow-2xl relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-purple/10 blur-[100px] rounded-full" />
             
             <div className="space-y-10 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-accent-purple">
                        <ShieldCheck size={24} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Patrimoine Net</span>
                    </div>
                    <div className="px-3 py-1 bg-accent-green/10 text-accent-green text-[10px] font-black rounded-full border border-accent-green/20 tracking-widest">
                        STABLE
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-7xl font-black text-white tracking-tighter">
                        €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(Math.floor(totalBalance))}
                        <span className="text-3xl text-[#444]">.{(totalBalance % 1).toFixed(2).split('.')[1]}</span>
                    </h2>
                    <div className="flex items-center gap-3 text-[#8e8e93] text-sm font-bold">
                        <div className="flex items-center gap-1.5 text-accent-green bg-accent-green/10 px-3 py-1 rounded-full border border-accent-green/10">
                            <TrendingUp size={16} />
                            <span>+2.4%</span>
                        </div>
                        <span className="opacity-40">vs mois dernier</span>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                    <div className="flex justify-between text-[#8e8e93] text-xs font-black uppercase tracking-widest">
                        <span>Disponibilité</span>
                        <span className="text-white">100% Liquide</span>
                    </div>
                    <div className="mt-4 h-3 w-full bg-black/40 rounded-full overflow-hidden p-[3px] border border-white/5">
                        <div className="h-full w-full bg-accent-purple rounded-full shadow-[0_0_20px_rgba(140,141,250,0.4)]" />
                    </div>
                </div>
             </div>
           </div>

           {/* Security / System Info */}
           <div className="p-10 rounded-[48px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex items-start gap-6 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                 <ShieldCheck size={24} className="text-[#8e8e93]" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-white text-sm font-black uppercase tracking-widest">Garantie Sécurité</h4>
                 <p className="text-[#8e8e93] text-sm leading-relaxed font-medium">
                    Synchronisation chiffrée via protocoles bancaires PSD2. Tes identifiants ne sont jamais stockés localement.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
