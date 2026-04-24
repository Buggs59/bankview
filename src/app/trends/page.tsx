'use client';

import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { Activity, ShoppingBag, Utensils, Car, Zap, MoreHorizontal, ArrowUpRight } from 'lucide-react';

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
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="pt-8 px-2 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-1">Tendances</h1>
        <p className="text-[#8e8e93] text-sm font-medium">Où va ton argent ?</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 px-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
         <div className="bg-card rounded-[32px] p-5 border border-white/5 space-y-1">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Dépense Moyenne</span>
            <p className="text-2xl font-bold text-white">€34.20</p>
            <span className="text-accent-green text-[10px] font-bold">↓ 4% vs mois dernier</span>
         </div>
         <div className="bg-card rounded-[32px] p-5 border border-white/5 space-y-1">
            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Fréquence</span>
            <p className="text-2xl font-bold text-white">1.4 tx/j</p>
            <span className="text-[#8e8e93] text-[10px] font-bold">Stable</span>
         </div>
      </div>

      {/* Merchant List */}
      <div className="space-y-4 px-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
         <div className="flex justify-between items-end px-2">
            <h2 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Top Marchands</h2>
            <button className="text-accent-purple text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                Tout voir <MoreHorizontal size={12} />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedMerchants.map((m: any, i) => (
                <div key={m.name} className="flex items-center gap-4 p-4 rounded-[24px] bg-card/50 hover:bg-card transition-colors border border-white/5 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-lg font-bold text-white shadow-inner group-hover:scale-105 transition-transform">
                        {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-bold truncate">{m.name}</h3>
                        <p className="text-[#8e8e93] text-xs font-medium">{m.count} achats ce mois</p>
                    </div>
                    <div className="text-right">
                        <p className="text-white text-sm font-bold">€{m.total.toFixed(0)}</p>
                        <div className="flex items-center justify-end gap-1 text-accent-purple">
                            <span className="text-[10px] font-black uppercase">Habitude</span>
                            <ArrowUpRight size={10} />
                        </div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}
