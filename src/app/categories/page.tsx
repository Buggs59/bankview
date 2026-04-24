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
    
    const cats: { [key: string]: { name: string, amount: number, icon: any, color: string } } = {};
    
    filtered.forEach(tx => {
        const name = tx.category?.name || 'Général';
        if (!cats[name]) {
            const color = name === 'Courses' ? '#8C8DFA' : name === 'Loisirs' ? '#34D399' : name === 'Logement' ? '#FBBF24' : name === 'Salaire' ? '#34D399' : '#8e8e93';
            cats[name] = { name, amount: 0, icon: name === 'Courses' ? ShoppingCart : name === 'Loisirs' ? Heart : name === 'Logement' ? Home : name === 'Salaire' ? Briefcase : MoreHorizontal, color };
        }
        cats[name].amount += Math.abs(tx.amount);
    });

    return Object.values(cats).sort((a, b) => b.amount - a.amount);
  }, [transactions, mode]);

  const totalAmount: number = categoriesData.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 pt-4 px-1">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start w-full">
        
        {/* Main Content: Categories List (Order 2 on mobile, 1 on desktop) */}
        <div className="order-2 lg:order-1 flex-1 space-y-10 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center px-2">
                 <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.2em]">Rapport par Catégorie</h3>
                 <button className="w-10 h-10 rounded-full bg-card border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors">
                    <Plus size={18} />
                 </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-12 gap-y-10">
                {categoriesData.map((cat, idx) => {
                    const percentage = (cat.amount / totalAmount) * 100;
                    return (
                        <div key={cat.name} className="space-y-4 group">
                            <div className="flex justify-between items-end px-1">
                                <div className="space-y-1">
                                    <h4 className="text-white text-base font-bold flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </h4>
                                    <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-wider">{percentage.toFixed(1)}% DU BUDGET</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white text-lg font-black tracking-tight">€{cat.amount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                    style={{ 
                                        width: `${percentage}%`,
                                        backgroundColor: cat.color,
                                        boxShadow: `0 0 15px ${cat.color}44`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Sidebar: Control Panel (Order 1 on mobile, 2 on desktop) */}
        <div className="order-1 lg:order-2 w-full lg:sticky lg:top-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-10 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent-purple/10 blur-[100px] rounded-full" />
              
              <div className="space-y-8 relative z-10 text-center">
                 <div className="flex justify-center items-center gap-4 text-[#8e8e93]">
                    <ChevronLeft className="cursor-pointer hover:text-white transition-colors" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Avril 2026</span>
                    <ChevronRight className="cursor-pointer hover:text-white transition-colors" />
                 </div>
                 
                 <div className="space-y-2">
                    <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest opacity-60">Total {mode === 'Spent' ? 'Dépensé' : 'Gagné'}</span>
                    <h2 className="text-6xl font-black text-white tracking-tighter">€{totalAmount.toFixed(2)}</h2>
                 </div>

                 <div className="flex bg-black/40 p-1.5 rounded-[24px] border border-white/5">
                    <button 
                        onClick={() => setMode('Spent')}
                        className={`flex-1 py-3 px-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Spent' ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-[#8e8e93] hover:text-white'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${mode === 'Spent' ? 'bg-accent-purple' : 'bg-[#444]'}`} />
                            Dépenses
                        </div>
                    </button>
                    <button 
                        onClick={() => setMode('Earned')}
                        className={`flex-1 py-3 px-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Earned' ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-[#8e8e93] hover:text-white'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${mode === 'Earned' ? 'bg-accent-green' : 'bg-[#444]'}`} />
                            Revenus
                        </div>
                    </button>
                 </div>
              </div>
           </div>

           {/* Insights Card */}
           <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-8 rounded-[40px] border border-white/5 space-y-4">
              <h4 className="text-accent-purple text-[10px] font-black uppercase tracking-widest">Analyse Rapide</h4>
              <p className="text-[#8e8e93] text-[13px] leading-relaxed font-medium">
                Ta plus grosse dépense ce mois-ci est <span className="text-white font-bold">Logement</span>, représentant <span className="text-white font-bold">35%</span> de ton budget.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
