'use client';

import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { ChevronLeft, ChevronRight, Wallet, ShoppingCart, Home, Car, Utensils, LayoutGrid } from 'lucide-react';

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

  // Simple categorization mock logic
  const categories = [
    { name: 'Shopping', amount: 1158, icon: ShoppingCart, color: '#8c8dfa' },
    { name: 'Services Financiers', amount: 895, icon: Wallet, color: '#2c2c2e' },
    { name: 'Logement', amount: 740, icon: Home, color: '#2c2c2e' },
    { name: 'Transport', amount: 171, icon: Car, color: '#2c2c2e' },
    { name: 'Alimentation', amount: 121, icon: Utensils, color: '#2c2c2e' },
    { name: 'Autres', amount: 87, icon: LayoutGrid, color: '#2c2c2e' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up">
      <h1 className="text-center text-xl font-bold text-white pt-4">Catégories</h1>

      <div className="space-y-6 text-center">
        <div>
            <span className="text-[#8e8e93] text-sm font-medium">Août 2022</span>
            <div className="flex items-center justify-center gap-6 mt-1">
                <button className="text-[#8e8e93] hover:text-white transition-colors"><ChevronLeft size={20}/></button>
                <h2 className="text-4xl font-bold text-white">€3 596</h2>
                <button className="text-[#8e8e93] hover:text-white transition-colors"><ChevronRight size={20}/></button>
            </div>
        </div>

        {/* Toggle Spent / Earned */}
        <div className="flex justify-center">
            <div className="bg-[#1c1c1e] p-1 rounded-full flex">
                <button 
                    onClick={() => setMode('Spent')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${mode === 'Spent' ? 'bg-[#2c2c2e] text-white' : 'text-[#8e8e93]'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-[#ffd60a]" /> Dépenses
                </button>
                <button 
                    onClick={() => setMode('Earned')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${mode === 'Earned' ? 'bg-[#2c2c2e] text-white' : 'text-[#8e8e93]'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-[#34d399]" /> Revenus
                </button>
            </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.map((cat, idx) => (
          <div 
            key={cat.name} 
            className={`flex justify-between items-center p-4 rounded-[24px] transition-all cursor-pointer animate-fade-in-up`}
            style={{ 
                backgroundColor: cat.color === '#2c2c2e' ? '#1c1c1e' : cat.color,
                animationDelay: `${(idx + 1) * 50}ms`
            }}
          >
            <div className="flex items-center gap-4">
                <cat.icon size={20} className={cat.color === '#8c8dfa' ? 'text-white' : 'text-[#8e8e93]'} />
                <span className={`text-sm font-bold ${cat.color === '#8c8dfa' ? 'text-white' : 'text-[#8e8e93]'}`}>{cat.name}</span>
            </div>
            <span className={`text-sm font-bold ${cat.color === '#8c8dfa' ? 'text-white' : 'text-white'}`}>€{cat.amount.toLocaleString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
