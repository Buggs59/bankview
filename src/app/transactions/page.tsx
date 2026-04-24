'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { Search, Calendar, Filter, ArrowUp, ArrowDown } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getTransactionsAction().then(data => {
      setTransactions(data || []);
      setLoading(false);
    });
  }, []);

  const filteredTransactions = useMemo(() => 
    transactions.filter(tx => 
        (tx.label || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [transactions, searchQuery]
  );

  const groupedTx = useMemo(() => {
    const groups: { [key: string]: { txs: any[], total: number } } = {};
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date_real);
      const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const capitalizedMonth = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      
      if (!groups[capitalizedMonth]) {
        groups[capitalizedMonth] = { txs: [], total: 0 };
      }
      groups[capitalizedMonth].txs.push(tx);
      groups[capitalizedMonth].total += tx.amount;
    });
    return groups;
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 pt-4 px-2">
      {/* Search Header */}
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
            <input 
                type="text" 
                placeholder="Rechercher une transaction..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card rounded-full py-4 pl-12 pr-6 text-sm text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#444] font-medium"
            />
        </div>
        <button className="w-12 h-12 rounded-full bg-card flex items-center justify-center border border-white/5 text-[#8e8e93]">
            <Filter size={18} />
        </button>
      </div>

      {/* Spending Summary Chart */}
      <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
         <div className="flex justify-between items-end px-2">
            <div>
                <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Dépenses Semaine</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">€865</span>
                    <span className="text-accent-green text-xs font-bold bg-accent-green/10 px-1.5 rounded flex items-center gap-0.5">
                        <ArrowDown size={10} /> 12%
                    </span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Moyenne</span>
                <p className="text-xl font-bold text-white">€124</p>
            </div>
         </div>

         <div className="h-44 flex items-end justify-between gap-1.5 px-1 pb-2">
            {[40, 65, 100, 75, 50, 45, 40].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                    <div 
                        className={`w-full rounded-[6px] transition-all duration-700 ease-premium ${i === 2 ? 'bg-accent-purple shadow-[0_0_15px_rgba(140,141,250,0.4)]' : 'bg-[#1c1c1e]'}`} 
                        style={{ height: `${h}%` }} 
                    />
                    <span className="text-[#444] text-[9px] font-black uppercase tracking-tighter">
                        {['S','D','L','M','M','J','V'][i]}
                    </span>
                </div>
            ))}
         </div>
      </div>

      {/* List grouped by month */}
      <div className="space-y-12 pt-4">
        {Object.entries(groupedTx).map(([month, data], mIdx) => (
            <div key={month} className="space-y-6 animate-fade-in-up" style={{ animationDelay: `${(mIdx + 2) * 100}ms` }}>
                <div className="flex justify-between items-baseline px-2 sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{month}</h2>
                    <span className="text-sm font-black text-[#8e8e93] uppercase tracking-widest">
                        €{Math.abs(data.total).toFixed(0)}
                    </span>
                </div>

                <div className="space-y-1">
                    {data.txs.map((tx) => {
                        const txDate = new Date(tx.date_real);
                        const isSpending = tx.amount < 0;
                        return (
                            <div key={tx.id} className="flex items-center gap-4 p-4 rounded-[28px] hover:bg-card/50 transition-all group active:scale-[0.98]">
                                <div className="w-14 h-14 rounded-2xl bg-card border border-white/5 flex flex-col items-center justify-center group-hover:border-accent-purple/30 transition-colors shadow-lg">
                                    <span className="text-[9px] text-[#8e8e93] font-black uppercase mb-0.5">
                                        {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                    </span>
                                    <span className="text-lg text-white font-bold leading-none">
                                        {txDate.getDate()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-sm font-bold truncate group-hover:text-accent-purple transition-colors">
                                        {tx.label}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[#8e8e93] text-[10px] font-bold uppercase tracking-wide">
                                            {tx.category?.name || 'Général'}
                                        </span>
                                        {tx.is_advance && (
                                            <span className="bg-accent-yellow/10 text-accent-yellow text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                                                Prévu
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-base font-black ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
                                        {isSpending ? '' : '+'}{Math.abs(tx.amount).toFixed(2)}€
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
