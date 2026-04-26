'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTransactionsAction, updateTransactionCategoryAction } from '@/app/actions/bank';
import { getCategoriesAction } from '@/app/actions/categories';
import { Search, Calendar, Filter, ArrowUp, ArrowDown, Tag, ChevronDown, CreditCard, ArrowRightLeft, RefreshCw, Info, FileText, CircleDollarSign, ArrowUpRight } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [txData, catData] = await Promise.all([
      getTransactionsAction(),
      getCategoriesAction()
    ]);
    setTransactions(txData || []);
    setCategories(catData || []);
    setLoading(false);
  }

  const handleUpdateCategory = async (txId: string, catId: string | null) => {
    setUpdatingId(txId);
    await updateTransactionCategoryAction(txId, catId);
    // On pourrait recharger toutes les données, mais pour la fluidité 
    // on met à jour l'état local si le succès est confirmé
    setTransactions(prev => prev.map(tx => 
      tx.id === txId ? { ...tx, category_id: catId, category: categories.find(c => c.id === catId) } : tx
    ));
    setUpdatingId(null);
  };

  const advanceTransactions = useMemo(() => 
    transactions.filter(tx => tx.is_advance).sort((a, b) => new Date(a.date_real).getTime() - new Date(b.date_real).getTime()),
    [transactions]
  );

  const regularTransactions = useMemo(() => 
    transactions.filter(tx => !tx.is_advance),
    [transactions]
  );

  const filteredRegularTransactions = useMemo(() => 
    regularTransactions.filter(tx => 
        (tx.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.clean_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.transaction_type || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [regularTransactions, searchQuery]
  );

  const { groups: groupedTx, sortedKeys: monthKeys } = useMemo(() => {
    const groups: Record<string, { label: string, txs: any[], total: number }> = {};
    
    filteredRegularTransactions.forEach(tx => {
      const date = new Date(tx.date_real);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      
      if (!groups[key]) {
        groups[key] = { label: capitalizedLabel, txs: [], total: 0 };
      }
      groups[key].txs.push(tx);
      groups[key].total += tx.amount;
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return { groups, sortedKeys };
  }, [filteredRegularTransactions]);

  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    if (monthKeys.length > 0 && !activeTab) {
      // Si on a des transactions "À venir", on pourrait vouloir commencer par là, 
      // mais sinon on prend le mois le plus récent.
      setActiveTab(monthKeys[0]);
    } else if (monthKeys.length === 0 && advanceTransactions.length > 0) {
      setActiveTab('upcoming');
    }
  }, [monthKeys, activeTab, advanceTransactions]);

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
    <div className="pb-32 pt-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-16 items-start w-full">
        
        {/* Main Content: Transactions List */}
        <div className="order-2 xl:order-1 space-y-12 w-full min-w-0">
          {/* Search Header inside main column */}
          <div className="flex items-center gap-4 animate-fade-in-up w-full mb-8">
            <div className="relative flex-1">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
                <input 
                    type="text" 
                    placeholder="Rechercher une transaction..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card rounded-2xl py-5 pl-14 pr-8 text-base text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#444] font-medium"
                />
            </div>
            <button className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center border border-white/5 text-[#8e8e93] hover:text-white transition-colors">
                <Filter size={20} />
            </button>
          </div>

          {/* Monthly Tabs Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 scroll-hide animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {advanceTransactions.length > 0 && (
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 rounded-2xl border transition-all whitespace-nowrap font-bold text-sm ${
                  activeTab === 'upcoming' 
                  ? 'bg-accent-yellow/10 border-accent-yellow text-accent-yellow shadow-[0_0_15px_rgba(255,214,10,0.2)]' 
                  : 'bg-card border-white/5 text-[#8e8e93] hover:text-white hover:border-white/10'
                }`}
              >
                À VENIR
              </button>
            )}
            {monthKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-2xl border transition-all whitespace-nowrap font-bold text-sm uppercase tracking-tight ${
                  activeTab === key 
                  ? 'bg-accent-purple/10 border-accent-purple text-accent-purple shadow-[0_0_15px_rgba(140,141,250,0.2)]' 
                  : 'bg-card border-white/5 text-[#8e8e93] hover:text-white hover:border-white/10'
                }`}
              >
                {groupedTx[key].label}
              </button>
            ))}
          </div>

          {/* Advance / Pending Section */}
          {activeTab === 'upcoming' && advanceTransactions.length > 0 && !searchQuery && (
              <div className="space-y-8 animate-fade-in-up">
                  <div className="flex justify-between items-end px-4 pb-5 border-b border-white/5">
                      <div className="space-y-1">
                        <span className="text-accent-yellow text-[10px] font-black uppercase tracking-[0.2em]">Flux futurs</span>
                        <h2 className="text-3xl font-bold text-white tracking-tight">À venir</h2>
                      </div>
                      <span className="text-sm font-black text-[#8e8e93] uppercase tracking-[0.2em]">
                          {advanceTransactions.length} OPÉRATION{advanceTransactions.length > 1 ? 'S' : ''}
                      </span>
                  </div>

                  <div className="space-y-2">
                      {advanceTransactions.map((tx) => {
                          const txDate = new Date(tx.date_real);
                          const isSpending = tx.amount < 0;
                          return (
                              <div key={tx.id} className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                  <div className="w-12 h-12 rounded-2xl bg-card border border-accent-yellow/20 flex flex-col items-center justify-center shrink-0 group-hover:border-accent-yellow transition-colors shadow-sm relative overflow-hidden">
                                      <div className="absolute inset-0 bg-accent-yellow/5 animate-pulse" />
                                      <span className="text-[8px] text-accent-yellow font-black uppercase tracking-widest relative z-10">
                                          {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                      </span>
                                      <span className="text-base text-white font-bold leading-none relative z-10">
                                          {txDate.getDate()}
                                      </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                          {tx.transaction_type && (
                                            <div className="shrink-0">
                                              {tx.transaction_type.toUpperCase().startsWith('CB') ? (
                                                <CreditCard size={14} className="text-accent-yellow opacity-60" />
                                              ) : tx.transaction_type.toUpperCase() === 'VIREMENT' ? (
                                                <ArrowUpRight size={14} className="text-accent-yellow opacity-60" />
                                              ) : tx.transaction_type.toUpperCase() === 'PRÉLÈVEMENT' ? (
                                                <RefreshCw size={14} className="text-accent-yellow opacity-60" />
                                              ) : tx.transaction_type.toUpperCase() === 'FRAIS' ? (
                                                <CircleDollarSign size={14} className="text-accent-yellow opacity-60" />
                                              ) : null}
                                            </div>
                                          )}
                                          <h4 className="text-white text-[15px] font-semibold truncate group-hover:text-accent-yellow transition-colors">
                                              {tx.clean_name || tx.label}
                                          </h4>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5">
                                          <div className="relative group/cat">
                                            <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded-lg transition-all cursor-pointer">
                                              <Tag size={10} className="text-accent-yellow opacity-70" />
                                              <select 
                                                value={tx.category_id || ''}
                                                onChange={(e) => handleUpdateCategory(tx.id, e.target.value || null)}
                                                className="appearance-none bg-transparent text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.1em] outline-none cursor-pointer hover:text-white transition-colors pr-4 min-w-[80px]"
                                                disabled={updatingId === tx.id}
                                              >
                                                <option value="" className="bg-[#1c1c1e]">Général</option>
                                                {categories
                                                  .filter(cat => {
                                                    const isExpense = tx.amount < 0;
                                                    return isExpense ? cat.families?.type === 'expense' : cat.families?.type === 'income';
                                                  })
                                                  .map(cat => (
                                                    <option key={cat.id} value={cat.id} className="bg-[#1c1c1e]">{cat.name}</option>
                                                  ))
                                                }
                                              </select>
                                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
                                            </div>
                                          </div>
                                          <span className="text-accent-yellow text-[9px] font-black uppercase bg-accent-yellow/10 px-1.5 py-0.5 rounded">
                                              PRÉVU
                                          </span>
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0 min-w-[120px]">
                                      <p className={`text-lg font-bold ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
                                          {isSpending ? '' : '+'}{Math.abs(tx.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                                      </p>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* Monthly Transaction List */}
          {activeTab !== 'upcoming' && groupedTx[activeTab] && (
              <div key={activeTab} className="space-y-8 animate-fade-in-up">
                  <div className="flex justify-between items-end px-4 pb-5 border-b border-white/5">
                      <h2 className="text-3xl font-bold text-white tracking-tight">{groupedTx[activeTab].label}</h2>
                      <span className="text-sm font-black text-[#8e8e93] uppercase tracking-[0.2em]">
                          TOTAL : {Math.abs(groupedTx[activeTab].total).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                      </span>
                  </div>
 
                  <div className="space-y-2">
                      {groupedTx[activeTab].txs.map((tx: any) => {
                          const txDate = new Date(tx.date_real);
                          const isSpending = tx.amount < 0;
                          return (
                              <div key={tx.id} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
                                  <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex flex-col items-center justify-center shrink-0 group-hover:border-accent-purple/30 transition-colors shadow-sm">
                                      <span className="text-[8px] text-[#8e8e93] font-black uppercase tracking-widest">
                                          {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                                      </span>
                                      <span className="text-base text-white font-bold leading-none">
                                          {txDate.getDate()}
                                      </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                          {tx.transaction_type && (
                                            <div className="shrink-0">
                                              {tx.transaction_type.toUpperCase().startsWith('CB') ? (
                                                <CreditCard size={14} className="text-accent-purple opacity-60" />
                                              ) : tx.transaction_type.toUpperCase() === 'VIREMENT' ? (
                                                <ArrowUpRight size={14} className="text-accent-purple opacity-60" />
                                              ) : tx.transaction_type.toUpperCase() === 'PRÉLÈVEMENT' ? (
                                                <RefreshCw size={14} className="text-accent-purple opacity-60" />
                                              ) : tx.transaction_type.toUpperCase() === 'FRAIS' ? (
                                                <CircleDollarSign size={14} className="text-accent-purple opacity-60" />
                                              ) : null}
                                            </div>
                                          )}
                                          <h4 className="text-white text-[15px] font-semibold truncate group-hover:text-accent-purple transition-colors">
                                              {tx.clean_name || tx.label}
                                          </h4>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5">
                                          <div className="relative group/cat">
                                            <div className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded-lg transition-all cursor-pointer">
                                              <Tag size={10} className="text-accent-purple opacity-70" />
                                              <select 
                                                value={tx.category_id || ''}
                                                onChange={(e) => handleUpdateCategory(tx.id, e.target.value || null)}
                                                className="appearance-none bg-transparent text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.1em] outline-none cursor-pointer hover:text-white transition-colors pr-4 min-w-[80px]"
                                                disabled={updatingId === tx.id}
                                              >
                                                <option value="" className="bg-[#1c1c1e]">Général</option>
                                                {categories
                                                  .filter(cat => {
                                                    const isExpense = tx.amount < 0;
                                                    return isExpense ? cat.families?.type === 'expense' : cat.families?.type === 'income';
                                                  })
                                                  .map(cat => (
                                                    <option key={cat.id} value={cat.id} className="bg-[#1c1c1e]">{cat.name}</option>
                                                  ))
                                                }
                                              </select>
                                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
                                            </div>
                                          </div>
                                          {tx.is_advance && (
                                              <span className="text-accent-yellow text-[9px] font-black uppercase bg-accent-yellow/10 px-1.5 py-0.5 rounded">
                                                  Prévu
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0 min-w-[120px]">
                                      <p className={`text-lg font-bold ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
                                          {isSpending ? '' : '+'}{Math.abs(tx.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                                      </p>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* Fallback when searching */}
          {searchQuery && filteredRegularTransactions.length === 0 && (
            <div className="text-center py-20 animate-fade-in-up">
              <p className="text-[#8e8e93] font-medium">Aucune transaction ne correspond à votre recherche.</p>
            </div>
          )}

          {searchQuery && filteredRegularTransactions.length > 0 && (
            <div className="space-y-4 animate-fade-in-up">
              {filteredRegularTransactions.map((tx) => {
                const txDate = new Date(tx.date_real);
                const isSpending = tx.amount < 0;
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
                    <div className="w-12 h-12 rounded-2xl bg-card border border-white/5 flex flex-col items-center justify-center shrink-0 group-hover:border-accent-purple/30 transition-colors shadow-sm">
                        <span className="text-[8px] text-[#8e8e93] font-black uppercase tracking-widest">
                            {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
                        </span>
                        <span className="text-base text-white font-bold leading-none">
                            {txDate.getDate()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {tx.transaction_type && (
                              <div className="shrink-0">
                                {tx.transaction_type.toUpperCase().startsWith('CB') ? (
                                  <CreditCard size={14} className="text-accent-purple opacity-60" />
                                ) : tx.transaction_type.toUpperCase() === 'VIREMENT' ? (
                                  <ArrowUpRight size={14} className="text-accent-purple opacity-60" />
                                ) : tx.transaction_type.toUpperCase() === 'PRÉLÈVEMENT' ? (
                                  <RefreshCw size={14} className="text-accent-purple opacity-60" />
                                ) : tx.transaction_type.toUpperCase() === 'FRAIS' ? (
                                  <CircleDollarSign size={14} className="text-accent-purple opacity-60" />
                                ) : null}
                              </div>
                            )}
                            <h4 className="text-white text-[15px] font-semibold truncate group-hover:text-accent-purple transition-colors">
                                {tx.clean_name || tx.label}
                            </h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.15em]">
                                {tx.category?.name || 'Général'}
                            </span>
                        </div>
                    </div>
                    <div className="text-right shrink-0 min-w-[120px]">
                        <p className={`text-lg font-bold ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
                            {isSpending ? '' : '+'}{Math.abs(tx.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spending Summary Chart */}
        <div className="order-1 xl:order-2 w-full xl:sticky xl:top-12 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[48px] p-10 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent-purple/5 blur-[80px] rounded-full" />
              
              <div className="flex justify-between items-end relative z-10">
                  <div>
                      <span className="text-[#8e8e93] text-[11px] font-black uppercase tracking-[0.2em]">Dépenses 7j</span>
                      <div className="flex items-baseline gap-3 mt-2">
                          <span className="text-5xl font-black text-white tracking-tighter">€{stats.weekTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</span>
                          <span className="text-accent-purple text-[10px] font-black bg-accent-purple/10 px-3 py-1 rounded-full uppercase tracking-widest">
                              7 Jours
                          </span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-[#8e8e93] text-[11px] font-black uppercase tracking-[0.2em]">Moyenne</span>
                      <p className="text-2xl font-bold text-white mt-1">€{stats.average.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                  </div>
              </div>
 
              <div className="h-56 flex items-end justify-between gap-3 px-1 relative z-10">
                  {stats.dayHeights.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-5 h-full justify-end group">
                          <div 
                              className={`w-full rounded-2xl transition-all duration-700 ease-premium ${h === Math.max(...stats.dayHeights) ? 'bg-accent-purple shadow-[0_0_30px_rgba(140,141,250,0.5)]' : 'bg-white/5 group-hover:bg-white/10'}`} 
                              style={{ height: `${Math.max(h, 6)}%` }} 
                          />
                          <span className="text-[#8e8e93] text-[10px] font-black uppercase tracking-tighter opacity-40">
                              {['S','D','L','M','M','J','V'][i]}
                          </span>
                      </div>
                  ))}
              </div>
           </div>
 
           {/* Info Cards */}
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all">
                  <span className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest block mb-2 opacity-60">Top Poste</span>
                  <p className="text-base font-bold text-white truncate">{stats.biggestCat}</p>
              </div>
              <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all">
                  <span className="text-[10px] font-black text-[#8e8e93] uppercase tracking-widest block mb-2 opacity-60">Activité</span>
                  <p className="text-base font-bold text-white">Constant</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
