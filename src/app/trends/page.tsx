'use client';

import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { Activity, ShoppingBag, Utensils, Car, Zap, MoreHorizontal, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';

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
  const merchants = transactions.reduce((acc: Record<string, any>, tx: any) => {
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

  const totalSpent: number = sortedMerchants.reduce((sum: number, m: any) => sum + (m.total || 0), 0);

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
        
        {/* Merchant Habits List */}
        <div className="order-2 xl:order-1 flex-1 space-y-12 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-end px-4">
                 <div className="space-y-2">
                    <h3 className="text-[#8e8e93] text-sm font-black uppercase tracking-[0.3em] opacity-60">Habitudes de Consommation</h3>
                    <h2 className="text-4xl font-black text-white tracking-tighter">Top Marchands</h2>
                 </div>
                 <button className="text-accent-purple text-xs font-black uppercase tracking-[0.1em] flex items-center gap-3 hover:bg-white/5 px-6 py-3 rounded-2xl transition-all border border-white/5 shadow-lg">
                    Tout voir <MoreHorizontal size={18} />
                 </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedMerchants.map((m: any, i) => (
                    <div key={m.name} className="flex items-center gap-6 p-8 rounded-[40px] bg-card/40 backdrop-blur-md hover:bg-card hover:border-white/10 transition-all border border-white/5 group active:scale-[0.98] shadow-xl">
                        <div className="w-20 h-20 rounded-[28px] bg-black/40 border border-white/5 flex items-center justify-center text-3xl font-black text-[#8e8e93] group-hover:text-accent-purple group-hover:border-accent-purple/30 transition-all shadow-2xl">
                            {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white text-xl font-bold truncate tracking-tight group-hover:text-accent-purple transition-colors">{m.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[#8e8e93] text-[11px] font-black uppercase tracking-[0.1em] opacity-40">{m.count} transactions</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white text-2xl font-black tracking-tighter">€{m.total.toFixed(0)}</p>
                            <div className="flex items-center justify-end gap-1.5 text-accent-purple text-xs font-black mt-1">
                                <ArrowUpRight size={14} />
                                <span>{totalSpent > 0 ? ((m.total / totalSpent) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Sidebar: Trend Insights */}
        <div className="order-1 xl:order-2 w-full xl:sticky xl:top-12 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[48px] p-12 border border-white/5 space-y-12 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-purple/10 blur-[100px] rounded-full" />
              
              <div className="space-y-10 relative z-10">
                 <div className="flex justify-between items-center">
                    <span className="text-[#8e8e93] text-xs font-black uppercase tracking-[0.2em] opacity-60">Volume de dépenses</span>
                    <div className="px-3 py-1 bg-accent-purple/10 text-accent-purple text-[10px] font-black rounded-full border border-accent-purple/20 uppercase tracking-[0.2em]">
                        MENSUEL
                    </div>
                 </div>
                 
                 <div className="space-y-4 text-center">
                    <h2 className="text-7xl font-black text-white tracking-tighter">€{totalSpent.toFixed(0)}</h2>
                    <p className="text-[#8e8e93] text-sm font-bold opacity-60">Dépenses totales analysées</p>
                 </div>

                 <div className="pt-8 space-y-6">
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden p-[3px] border border-white/5 shadow-inner">
                        <div className="h-full w-2/3 bg-accent-purple shadow-[0_0_20px_rgba(140,141,250,0.5)] rounded-full transition-all duration-1000" />
                    </div>

                    <div className="flex justify-between text-[11px] font-black text-[#444] uppercase tracking-[0.2em] px-2">
                        <span>Mars</span>
                        <span className="text-white">Avril</span>
                        <span>Mai</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* AI Insight Card */}
           <div className="p-10 rounded-[48px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 space-y-6 shadow-xl">
              <div className="flex items-center gap-4 text-accent-purple">
                 <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
                    <TrendingUp size={24} />
                 </div>
                 <h4 className="text-xs font-black uppercase tracking-[0.2em]">Rapport d'Intelligence</h4>
              </div>
              <p className="text-[#8e8e93] text-base leading-relaxed font-medium">
                Tes dépenses chez <span className="text-white font-bold underline decoration-accent-purple/30 underline-offset-4">{sortedMerchants[0]?.name || 'tes marchands'}</span> sont en hausse de <span className="text-white font-bold">12%</span> par rapport au mois dernier. 
                Une opportunité d'optimisation est possible sur tes abonnements récurrents.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
