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
    <div className="space-y-8 pb-32 pt-4 px-2">
      {/* Period Selector & Total */}
      <div className="text-center space-y-2 animate-fade-in-up">
        <div className="flex items-center justify-center gap-4 text-[#8e8e93]">
            <button className="p-2 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
            <span className="text-xs font-black uppercase tracking-widest">Avril 2026</span>
            <button className="p-2 hover:text-white transition-colors"><ChevronRight size={20}/></button>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1">
                {mode === 'Spent' ? 'Total Dépensé' : 'Total Gagné'}
            </span>
            <h2 className="text-5xl font-bold text-white tracking-tight">
                €{totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
            </h2>
        </div>
      </div>

      {/* Toggle Spent / Earned (Billi Style) */}
      <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-card p-1 rounded-full flex border border-white/5 shadow-xl">
              <button 
                  onClick={() => setMode('Spent')}
                  className={`flex items-center gap-2 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Spent' ? 'bg-white/10 text-white shadow-lg' : 'text-[#8e8e93] hover:text-white/60'}`}
              >
                  <div className={`w-2 h-2 rounded-full ${mode === 'Spent' ? 'bg-accent-purple shadow-[0_0_8px_rgba(140,141,250,0.6)]' : 'bg-[#444]'}`} /> 
                  Dépenses
              </button>
              <button 
                  onClick={() => setMode('Earned')}
                  className={`flex items-center gap-2 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'Earned' ? 'bg-white/10 text-white shadow-lg' : 'text-[#8e8e93] hover:text-white/60'}`}
              >
                  <div className={`w-2 h-2 rounded-full ${mode === 'Earned' ? 'bg-accent-green shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#444]'}`} /> 
                  Revenus
              </button>
          </div>
      </div>

      {/* Categories List with Progress Bars */}
      <div className="space-y-6 px-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex justify-between items-center">
             <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Par Catégorie</h3>
             <Plus size={16} className="text-[#8e8e93]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {categoriesData.map((cat, idx) => {
                const percentage = (cat.amount / totalAmount) * 100;
                return (
                    <div key={cat.name} className="space-y-2 group">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-card border border-white/5 flex items-center justify-center text-[#8e8e93] group-hover:text-white transition-colors">
                                    <cat.icon size={16} />
                                </div>
                                <span className="text-white text-sm font-bold">{cat.name}</span>
                            </div>
                            <span className="text-white text-sm font-bold">€{cat.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="h-2 w-full bg-[#1c1c1e] rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 delay-${idx*100} ${mode === 'Spent' ? 'bg-accent-purple shadow-[0_0_10px_rgba(140,141,250,0.2)]' : 'bg-accent-green shadow-[0_0_10px_rgba(52,211,153,0.2)]'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <div className="flex justify-between px-1">
                            <span className="text-[9px] text-[#444] font-black uppercase tracking-widest">{percentage.toFixed(1)}% du total</span>
                            <span className="text-[9px] text-[#444] font-black uppercase tracking-widest">{mode === 'Spent' ? 'Dépense' : 'Gain'}</span>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
