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
    <div className="space-y-10 pb-32 pt-4 px-1">
      {/* Search Header */}
      <div className="flex items-center gap-3 animate-fade-in-up w-full">
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
        <button className="w-12 h-12 rounded-full bg-card flex items-center justify-center border border-white/5 text-[#8e8e93] hover:text-white transition-colors">
            <Filter size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start w-full">
        
        {/* Main Content: Transactions List (Order 2 on mobile, 1 on desktop) */}
        <div className="order-2 lg:order-1 flex-1 space-y-12 w-full">
          {Object.entries(groupedTx).map(([month, data], mIdx) => (
              <div key={month} className="space-y-6 animate-fade-in-up" style={{ animationDelay: `${(mIdx + 2) * 100}ms` }}>
                  <div className="flex justify-between items-baseline px-2 sticky top-0 bg-[#050505]/90 backdrop-blur-xl py-4 z-10 border-b border-white/5">
                      <h2 className="text-3xl font-bold text-white tracking-tight">{month}</h2>
                      <span className="text-sm font-black text-[#8e8e93] uppercase tracking-widest">
                          €{Math.abs(data.total).toFixed(0)}
                      </span>
                  </div>

                  <div className="space-y-2">
                      {data.txs.map((tx) => {
                          const txDate = new Date(tx.date_real);
                          const isSpending = tx.amount < 0;
                          return (
                              <div key={tx.id} className="flex items-center gap-6 p-4 rounded-[28px] hover:bg-white/[0.03] transition-all group active:scale-[0.99] border border-transparent hover:border-white/5">
                                  <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex flex-col items-center justify-center shrink-0 group-hover:border-accent-purple/30 transition-colors shadow-sm">
                                      <span className="text-[8px] text-[#8e8e93] font-black uppercase mb-0.5">
                                          {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                      </span>
                                      <span className="text-base text-white font-bold leading-none">
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
                                  <div className="text-right shrink-0">
                                      <p className={`text-base font-black ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
                                          {isSpending ? '' : '+'}{Math.abs(tx.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                                      </p>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          ))}
        </div>

        {/* Spending Summary Chart - Order 1 on mobile, 2 on desktop */}
        <div className="order-1 lg:order-2 w-full lg:sticky lg:top-8 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl">
              <div className="flex justify-between items-end">
                  <div>
                      <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Dépenses Semaine</span>
                      <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-4xl font-bold text-white">€865</span>
                          <span className="text-accent-green text-xs font-bold bg-accent-green/10 px-1.5 rounded flex items-center gap-0.5">
                              <ArrowDown size={10} /> 12%
                          </span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Moyenne</span>
                      <p className="text-xl font-bold text-white mt-1">€124</p>
                  </div>
              </div>

              <div className="h-44 flex items-end justify-between gap-2 px-1">
                  {[40, 65, 100, 75, 50, 45, 40].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                          <div 
                              className={`w-full rounded-xl transition-all duration-700 ease-premium ${i === 2 ? 'bg-accent-purple shadow-[0_0_20px_rgba(140,141,250,0.4)]' : 'bg-white/5 group-hover:bg-white/10'}`} 
                              style={{ height: `${h}%` }} 
                          />
                          <span className="text-[#444] text-[10px] font-black uppercase tracking-tighter">
                              {['S','D','L','M','M','J','V'][i]}
                          </span>
                      </div>
                  ))}
              </div>
           </div>

           {/* Quick Filter or Legend */}
           <div className="grid grid-cols-2 gap-3 px-2">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                  <span className="text-[9px] font-black text-[#8e8e93] uppercase block mb-1">Plus gros poste</span>
                  <p className="text-sm font-bold text-white">Loyer</p>
              </div>
              <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                  <span className="text-[9px] font-black text-[#8e8e93] uppercase block mb-1">Fréquence</span>
                  <p className="text-sm font-bold text-white">Quotidienne</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
