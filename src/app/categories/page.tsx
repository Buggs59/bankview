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
    const targetType = isSpending ? 'expense' : 'income';
    
    // On filtre les transactions par le type de leur famille de catégorie
    const filtered = transactions.filter(tx => {
      const familyType = tx.category?.families?.type || (tx.amount < 0 ? 'expense' : 'income');
      return familyType === targetType;
    });
    
    const cats: { [key: string]: { name: string, amount: number, icon: any, color: string } } = {};
    
    filtered.forEach(tx => {
        const category = tx.category;
        const name = category?.name || 'Général';
        const familyName = category?.families?.name || '';
        const key = category?.id || 'general';

        if (!cats[key]) {
            // Mapping des couleurs par défaut ou par famille si possible
            let color = '#8e8e93';
            if (category?.families?.name === 'Besoins') color = '#8C8DFA';
            if (category?.families?.name === 'Envies') color = '#34D399';
            if (category?.families?.name === 'Revenus') color = '#34D399';
            
            // Mapping d'icônes simplifié pour la démo
            const iconName = category?.icon || 'MoreHorizontal';
            const IconComponent = getIconByName(iconName);

            cats[key] = { 
              name: familyName ? `${familyName} : ${name}` : name, 
              amount: 0, 
              icon: IconComponent, 
              color 
            };
        }
        cats[key].amount += Math.abs(tx.amount);
    });

    return Object.values(cats).sort((a, b) => b.amount - a.amount);
  }, [transactions, mode]);

  // Helper pour mapper les noms d'icônes stockés en string
  function getIconByName(name: string) {
    const icons: Record<string, any> = {
      ShoppingCart, Home, Car, Utensils, Heart, Briefcase, Plus, MoreHorizontal
    };
    return icons[name] || MoreHorizontal;
  }

  const totalAmount: number = categoriesData.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 pt-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-16 items-start w-full">
        
        {/* Main Content: Categories List */}
        <div className="order-2 xl:order-1 flex-1 space-y-12 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center px-4">
                 <h3 className="text-[#8e8e93] text-sm font-black uppercase tracking-[0.3em] opacity-60">Rapport par Catégorie</h3>
                 <button className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-colors">
                    <Plus size={20} />
                 </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categoriesData.map((cat, idx) => {
                    const percentage = (cat.amount / totalAmount) * 100;
                    const Icon = cat.icon;
                    return (
                        <div key={cat.name} className="bg-card/40 backdrop-blur-md p-10 rounded-[48px] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden shadow-xl">
                            <div className="absolute -right-12 -top-12 w-40 h-40 opacity-10 blur-3xl rounded-full" style={{ backgroundColor: cat.color }} />
                            
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-[28px] bg-black/40 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl group-hover:border-white/10">
                                        <Icon size={32} style={{ color: cat.color }} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-white text-2xl font-bold tracking-tight">{cat.name}</h4>
                                        <p className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.1em] opacity-40">
                                            {percentage.toFixed(1)}% du budget
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-white text-2xl font-black tracking-tighter">€{cat.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            <div className="mt-10 space-y-4">
                                <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-[3px] border border-white/5">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 ease-premium"
                                        style={{ 
                                            width: `${Math.max(percentage, 2)}%`,
                                            backgroundColor: cat.color,
                                            boxShadow: `0 0 25px ${cat.color}44`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Sidebar: Control Panel */}
        <div className="order-1 xl:order-2 w-full xl:sticky xl:top-12 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[48px] p-12 border border-white/5 space-y-12 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-purple/10 blur-[100px] rounded-full" />
              
              <div className="space-y-10 relative z-10 text-center">
                 <div className="flex justify-center items-center gap-6 text-[#8e8e93]">
                    <ChevronLeft className="cursor-pointer hover:text-white transition-colors" size={24} />
                    <span className="text-sm font-black uppercase tracking-[0.4em] text-white">Avril 2026</span>
                    <ChevronRight className="cursor-pointer hover:text-white transition-colors" size={24} />
                 </div>
                 
                 <div className="space-y-3">
                    <span className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.2em] opacity-50">Total {mode === 'Spent' ? 'Dépensé' : 'Gagné'}</span>
                    <h2 className="text-7xl font-black text-white tracking-tighter">€{totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</h2>
                 </div>

                 <div className="flex bg-black/40 p-2 rounded-[32px] border border-white/5 shadow-inner">
                    <button 
                        onClick={() => setMode('Spent')}
                        className={`flex-1 py-4 px-6 rounded-[24px] text-xs font-black uppercase tracking-[0.1em] transition-all ${mode === 'Spent' ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-[#8e8e93] hover:text-white'}`}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${mode === 'Spent' ? 'bg-accent-purple shadow-[0_0_8px_rgba(140,141,250,0.8)]' : 'bg-[#444]'}`} />
                            Dépenses
                        </div>
                    </button>
                    <button 
                        onClick={() => setMode('Earned')}
                        className={`flex-1 py-4 px-6 rounded-[24px] text-xs font-black uppercase tracking-[0.1em] transition-all ${mode === 'Earned' ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-[#8e8e93] hover:text-white'}`}
                    >
                        <div className="flex items-center justify-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${mode === 'Earned' ? 'bg-accent-green shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-[#444]'}`} />
                            Revenus
                        </div>
                    </button>
                 </div>
              </div>
           </div>

           {/* Insights Card */}
           <div className="bg-gradient-to-br from-white/[0.03] to-transparent p-10 rounded-[48px] border border-white/5 space-y-6 shadow-xl">
              <h4 className="text-accent-purple text-xs font-black uppercase tracking-[0.2em]">Analyse IA</h4>
              <p className="text-[#8e8e93] text-base leading-relaxed font-medium">
                Ta plus grosse dépense ce mois-ci est <span className="text-white font-bold underline decoration-accent-purple/30 underline-offset-4">Logement</span>, représentant <span className="text-white font-bold">35%</span> de ton budget global.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
