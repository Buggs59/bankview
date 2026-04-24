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

  const totalSpent = sortedMerchants.reduce((sum, m: any) => sum + m.total, 0);

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
        
        {/* Merchant Habits List (Order 2 on mobile, 1 on desktop) */}
        <div className="order-2 lg:order-1 flex-1 space-y-10 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
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
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">{m.count} transactions</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white text-lg font-black tracking-tight">€{m.total.toFixed(0)}</p>
                            <div className="flex items-center justify-end gap-1 text-accent-purple text-[10px] font-bold mt-1">
                                <span>{totalSpent > 0 ? ((m.total / totalSpent) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Sidebar: Trend Insights (Order 1 on mobile, 2 on desktop) */}
        <div className="order-1 lg:order-2 w-full lg:sticky lg:top-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-purple/10 blur-[80px] rounded-full" />
              
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-center">
                    <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Évolution Mensuelle</span>
                    <div className="px-2 py-0.5 bg-accent-purple/10 text-accent-purple text-[9px] font-black rounded-full border border-accent-purple/20 uppercase tracking-widest">
                        Focus
                    </div>
                 </div>
                 
                 <div className="space-y-2 text-center py-4">
                    <h2 className="text-5xl font-bold text-white tracking-tight">€{totalSpent.toFixed(0)}</h2>
                    <p className="text-[#8e8e93] text-xs font-semibold">Dépenses totales analysées</p>
                 </div>

                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-accent-purple shadow-[0_0_15px_rgba(140,141,250,0.4)] rounded-full transition-all duration-1000" />
                 </div>

                 <div className="flex justify-between text-[10px] font-black text-[#444] uppercase tracking-widest px-1">
                    <span>Mars</span>
                    <span className="text-white">Avril</span>
                    <span>Mai</span>
                 </div>
              </div>
           </div>

           {/* AI Insight Card */}
           <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-accent-purple">
                 <TrendingUp size={20} />
                 <h4 className="text-[10px] font-black uppercase tracking-widest">Analyse IA</h4>
              </div>
              <p className="text-[#8e8e93] text-xs leading-relaxed font-medium">
                Tes dépenses chez <span className="text-white font-bold">{sortedMerchants[0]?.name || 'tes marchands'}</span> sont en hausse. 
                Pense à vérifier tes abonnements.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
