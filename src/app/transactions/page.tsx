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

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekTx = transactions.filter(tx => new Date(tx.date_real) >= oneWeekAgo && tx.amount < 0);
    const weekTotal = weekTx.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    // Day by day for chart
    const days = [0,0,0,0,0,0,0]; // S, D, L, M, M, J, V (starting from Sunday index 0 in JS is Sun)
    // Actually let's map to S, D, L, M, M, J, V matching the labels
    // Label order: S, D, L, M, M, J, V
    // JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // Target indices: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
    const dayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
    
    weekTx.forEach(tx => {
      const day = new Date(tx.date_real).getDay();
      const idx = dayMap[day];
      if (idx !== undefined) days[idx] += Math.abs(tx.amount);
    });

    const maxDay = Math.max(...days, 1);
    const dayHeights = days.map(d => (d / maxDay) * 100);

    // Biggest post
    const catTotals: Record<string, number> = {};
    weekTx.forEach(tx => {
      const cat = tx.category?.name || 'Général';
      catTotals[cat] = (catTotals[cat] || 0) + Math.abs(tx.amount);
    });
    const biggestCat = Object.entries(catTotals).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { weekTotal, dayHeights, biggestCat, average: weekTotal / 7 };
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4 px-1">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start w-full">
        
        {/* Main Content: Transactions List */}
        <div className="order-2 lg:order-1 space-y-12 w-full min-w-0">
          {/* Search Header inside main column */}
          <div className="flex items-center gap-3 animate-fade-in-up w-full mb-12">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
                <input 
                    type="text" 
                    placeholder="Rechercher une transaction..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card rounded-2xl py-4 pl-12 pr-6 text-sm text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#444] font-medium"
                />
            </div>
            <button className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center border border-white/5 text-[#8e8e93] hover:text-white transition-colors">
                <Filter size={18} />
            </button>
          </div>

          {Object.entries(groupedTx).map(([month, data], mIdx) => (
              <div key={month} className="space-y-6 animate-fade-in-up" style={{ animationDelay: `${(mIdx + 1) * 50}ms` }}>
                  <div className="flex justify-between items-end px-2 pb-4 border-b border-white/5">
                      <h2 className="text-2xl font-bold text-white tracking-tight">{month}</h2>
                      <span className="text-xs font-black text-[#8e8e93] uppercase tracking-widest">
                          TOTAL : {Math.abs(data.total).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                      </span>
                  </div>
 
                  <div className="space-y-1">
                      {data.txs.map((tx) => {
                          const txDate = new Date(tx.date_real);
                          const isSpending = tx.amount < 0;
                          return (
                              <div key={tx.id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
                                  <div className="w-10 h-10 rounded-xl bg-card border border-white/5 flex flex-col items-center justify-center shrink-0 group-hover:border-accent-purple/30 transition-colors shadow-sm">
                                      <span className="text-[7px] text-[#8e8e93] font-black uppercase">
                                          {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                      </span>
                                      <span className="text-sm text-white font-bold leading-none">
                                          {txDate.getDate()}
                                      </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="text-white text-sm font-semibold truncate group-hover:text-accent-purple transition-colors">
                                          {tx.label}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[#444] text-[9px] font-black uppercase tracking-wide">
                                              {tx.category?.name || 'Général'}
                                          </span>
                                          {tx.is_advance && (
                                              <span className="text-accent-yellow text-[8px] font-black uppercase">
                                                  • Prévu
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0 min-w-[90px]">
                                      <p className={`text-base font-bold ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
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

        {/* Spending Summary Chart */}
        <div className="order-1 lg:order-2 w-full lg:sticky lg:top-8 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl">
              <div className="flex justify-between items-end">
                  <div>
                      <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Dépenses 7j</span>
                      <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-4xl font-bold text-white">€{stats.weekTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</span>
                          <span className="text-accent-purple text-[10px] font-bold bg-accent-purple/10 px-2 py-0.5 rounded-full">
                              Semaine
                          </span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest">Moyenne /j</span>
                      <p className="text-xl font-bold text-white mt-1">€{stats.average.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                  </div>
              </div>
 
              <div className="h-44 flex items-end justify-between gap-2 px-1">
                  {stats.dayHeights.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                          <div 
                              className={`w-full rounded-xl transition-all duration-700 ease-premium ${h === Math.max(...stats.dayHeights) ? 'bg-accent-purple shadow-[0_0_20px_rgba(140,141,250,0.4)]' : 'bg-white/5 group-hover:bg-white/10'}`} 
                              style={{ height: `${Math.max(h, 4)}%` }} 
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
                  <span className="text-[9px] font-black text-[#8e8e93] uppercase block mb-1">Top Poste</span>
                  <p className="text-sm font-bold text-white truncate">{stats.biggestCat}</p>
              </div>
              <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                  <span className="text-[9px] font-black text-[#8e8e93] uppercase block mb-1">Activité</span>
                  <p className="text-sm font-bold text-white">7 derniers jours</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
