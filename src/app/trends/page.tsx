'use client';

import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { Activity, ShoppingBag, Utensils, Car, Zap, MoreHorizontal, ArrowUpRight, TrendingDown } from 'lucide-react';

export default function TrendsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactionsAction().then((txs) => {
      setTransactions(txs || []);
      setLoading(false);
    });
  }, []);

  // Group by merchant (simplified label logic)
  const merchants = transactions.reduce((acc: any, tx) => {
    if (tx.amount >= 0) return acc; // Only spending
    
    // Simple cleaning for common merchants
    let merchantName = tx.label.split(/[0-9*]/)[0].trim();
    if (merchantName.length < 3) merchantName = tx.label;
    
    if (!acc[merchantName]) {
      acc[merchantName] = { name: merchantName, total: 0, count: 0, category: tx.category };
    }
    acc[merchantName].total += Math.abs(tx.amount);
    acc[merchantName].count += 1;
    return acc;
  }, {});

  const sortedMerchants = Object.values(merchants)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 pt-4 px-1">
      
      <div className="flex flex-col lg:flex-row-reverse gap-12 items-stretch lg:items-start w-full">
        
        {/* Trend Insights - Sticky on Desktop */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
             <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-accent-green">
                        <Activity size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Aperçu Analytique</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1">
                        <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Dépense Moyenne</span>
                        <p className="text-3xl font-bold text-white">€34.20</p>
                        <div className="flex items-center gap-1 text-accent-green text-[10px] font-bold">
                            <TrendingDown size={12} />
                            <span>↓ 4% vs mois dernier</span>
                        </div>
                    </div>
                    <div className="w-full h-px bg-white/5" />
                    <div className="space-y-1">
                        <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Fréquence</span>
                        <p className="text-3xl font-bold text-white">1.4 tx/j</p>
                        <span className="text-[#444] text-[10px] font-bold uppercase tracking-widest">Rythme Stable</span>
                    </div>
                </div>
             </div>
           </div>

           {/* AI Insight Placeholder */}
           <div className="p-6 rounded-[32px] bg-accent-green/5 border border-accent-green/10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                 <Zap size={20} className="text-accent-green" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-white text-xs font-bold uppercase tracking-wide">Conseil Budget</h4>
                 <p className="text-[#8e8e93] text-[11px] leading-relaxed">
                    Tu as dépensé <span className="text-white font-bold">15% de moins</span> chez tes marchands habituels cette semaine. Continue comme ça !
                 </p>
              </div>
           </div>
        </div>

        {/* Merchant Habits List */}
        <div className="flex-1 space-y-10 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-end px-2">
                 <div className="space-y-1">
                    <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.2em]">Habitudes de Consommation</h3>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Top Marchands</h2>
                 </div>
                 <button className="text-accent-purple text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 px-4 py-2 rounded-full transition-all">
                    Tout voir <MoreHorizontal size={14} />
                 </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {sortedMerchants.map((m: any, i) => (
                    <div key={m.name} className="flex items-center gap-5 p-5 rounded-[32px] bg-card/50 hover:bg-card hover:border-white/10 transition-all border border-white/5 group active:scale-[0.98]">
                        <div className="w-16 h-16 rounded-2xl bg-card border border-white/5 flex items-center justify-center text-xl font-bold text-[#8e8e93] group-hover:text-accent-purple group-hover:border-accent-purple/30 transition-all shadow-lg">
                            {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white text-base font-bold truncate group-hover:text-accent-purple transition-colors">{m.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[#444] text-[10px] font-black uppercase tracking-wider">{m.count} transactions</span>
                                <div className="w-1 h-1 rounded-full bg-[#444]" />
                                <span className="text-[#8e8e93] text-[10px] font-bold uppercase tracking-wide">
                                    {m.category?.name || 'Général'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white text-lg font-black tracking-tight">€{m.total.toFixed(0)}</p>
                            <div className="flex items-center justify-end gap-1.5 text-accent-purple mt-1">
                                <span className="text-[9px] font-black uppercase tracking-tighter">Habitude</span>
                                <ArrowUpRight size={12} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
