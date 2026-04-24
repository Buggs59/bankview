'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { ChevronLeft, ChevronRight, ShoppingCart, Home, Car, Utensils, Heart, Briefcase, Plus, MoreHorizontal } from 'lucide-react';

export default function CategoriesPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'Spent' | 'Earned'>('Spent');

  useEffect(() => {
    getTransactionsAction().then(data => {
      setTransactions(data || []);
      setLoading(false);
    });
  }, []);

  const categoriesData = useMemo(() => {
    const isSpending = mode === 'Spent';
    const filtered = transactions.filter(tx => isSpending ? tx.amount < 0 : tx.amount > 0);
    
    const cats: { [key: string]: { name: string, amount: number, icon: any } } = {};
    
    filtered.forEach(tx => {
        const name = tx.category?.name || 'Général';
        if (!cats[name]) {
            cats[name] = { name, amount: 0, icon: name === 'Courses' ? ShoppingCart : name === 'Loisirs' ? Heart : name === 'Logement' ? Home : name === 'Salaire' ? Briefcase : MoreHorizontal };
        }
        cats[name].amount += Math.abs(tx.amount);
    });

    return Object.values(cats).sort((a, b) => b.amount - a.amount);
  }, [transactions, mode]);

  const totalAmount = categoriesData.reduce((sum, c) => sum + c.amount, 0);

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
        
        {/* Control Panel - Sticky on Desktop */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-4 text-[#8e8e93]">
                    <button className="p-2 hover:text-white transition-colors bg-white/5 rounded-full"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Avril 2026</span>
                    <button className="p-2 hover:text-white transition-colors bg-white/5 rounded-full"><ChevronRight size={18}/></button>
                </div>
                
                <div className="flex flex-col items-center">
                    <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1">
                        {mode === 'Spent' ? 'Total Dépensé' : 'Total Gagné'}
                    </span>
                    <h2 className="text-5xl font-bold text-white tracking-tight">
                        €{totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                    </h2>
                </div>

                {/* Toggle Spent / Earned */}
                <div className="bg-[#050505] p-1.5 rounded-full flex border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setMode('Spent')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Spent' ? 'bg-white/10 text-white shadow-lg' : 'text-[#8e8e93] hover:text-white/60'}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${mode === 'Spent' ? 'bg-accent-purple shadow-[0_0_8px_rgba(140,141,250,0.6)]' : 'bg-[#444]'}`} /> 
                        Dépenses
                    </button>
                    <button 
                        onClick={() => setMode('Earned')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Earned' ? 'bg-white/10 text-white shadow-lg' : 'text-[#8e8e93] hover:text-white/60'}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${mode === 'Earned' ? 'bg-accent-green shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#444]'}`} /> 
                        Revenus
                    </button>
                </div>
              </div>
           </div>

           {/* Insights Card */}
           <div className="p-6 rounded-[32px] bg-accent-purple/5 border border-accent-purple/10">
              <h4 className="text-accent-purple text-[10px] font-black uppercase tracking-widest mb-3">Analyse Rapide</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Ta plus grosse dépense ce mois-ci est <span className="font-bold text-white">Logement</span>, représentant <span className="font-bold text-white">35%</span> de ton budget.
              </p>
           </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 space-y-10 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center px-2">
                 <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.2em]">Rapport par Catégorie</h3>
                 <button className="w-10 h-10 rounded-full bg-card border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors">
                    <Plus size={18} />
                 </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-10">
                {categoriesData.map((cat, idx) => {
                    const percentage = (cat.amount / totalAmount) * 100;
                    return (
                        <div key={cat.name} className="space-y-3 group">
                            <div className="flex justify-between items-center px-1">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-[#8e8e93] group-hover:text-white group-hover:border-white/10 transition-all shadow-lg">
                                        <cat.icon size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-base font-bold">{cat.name}</span>
                                        <span className="text-[10px] text-[#444] font-black uppercase tracking-widest">{percentage.toFixed(1)}% du budget</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-white text-lg font-black tracking-tight">€{cat.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-[#1c1c1e] rounded-full overflow-hidden p-[2px]">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 delay-${idx*100} ${mode === 'Spent' ? 'bg-accent-purple shadow-[0_0_15px_rgba(140,141,250,0.3)]' : 'bg-accent-green shadow-[0_0_15px_rgba(52,211,153,0.3)]'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
}
