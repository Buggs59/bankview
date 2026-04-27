'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTransactionsAction, updateTransactionCategoryAction } from '@/app/actions/bank';
import { getCategoriesAction } from '@/app/actions/categories';
import { Search, Calendar, Filter, ArrowUp, ArrowDown, Tag, ChevronDown, CreditCard, ArrowRightLeft, RefreshCw, Info, FileText, CircleDollarSign, ArrowUpRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeableTransaction from '@/components/SwipeableTransaction';

export default function TransactionsPage() {
  // ... existing states ...
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
    const originalTx = transactions.find(t => t.id === txId);
    
    // Optimistic Update
    setTransactions(prev => prev.map(tx => 
      tx.id === txId ? { ...tx, category_id: catId, category: categories.find(c => c.id === catId) } : tx
    ));

    setUpdatingId(txId);
    const res = await updateTransactionCategoryAction(txId, catId);
    
    if (res.error) {
      // Rollback on error
      setTransactions(prev => prev.map(tx => tx.id === txId ? originalTx : tx));
      alert(`Erreur: ${res.error}`);
    }
    setUpdatingId(null);
  };

  const advanceTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => tx.is_advance);
    if (selectedCategoryId === 'un-categorized') {
      filtered = filtered.filter(tx => !tx.category_id);
    } else if (selectedCategoryId) {
      filtered = filtered.filter(tx => tx.category_id === selectedCategoryId);
    }
    // Only exclude if it is linked to something
    filtered = filtered.filter(tx => !tx.link_id && !tx.linked_id);
    return filtered.sort((a, b) => new Date(a.date_real).getTime() - new Date(b.date_real).getTime());
  }, [transactions, selectedCategoryId]);

  const regularTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => !tx.is_advance);
    if (selectedCategoryId === 'un-categorized') {
      filtered = filtered.filter(tx => !tx.category_id);
    } else if (selectedCategoryId) {
      filtered = filtered.filter(tx => tx.category_id === selectedCategoryId);
    }
    // We keep linked transactions in the list but we will handle them in stats
    return filtered;
  }, [transactions, selectedCategoryId]);

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
      // Exclude linked transactions from the monthly totals
      if (tx.link_id || tx.linked_id) return;

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
      setActiveTab(monthKeys[0]);
    } else if (monthKeys.length === 0 && advanceTransactions.length > 0) {
      setActiveTab('upcoming');
    }
  }, [monthKeys, activeTab, advanceTransactions]);


  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4 max-w-4xl mx-auto">
      <div className="space-y-12 w-full min-w-0">
          {/* Search Header inside main column */}
          <div className="flex items-center gap-4 animate-fade-in-up w-full mb-8 z-[50] relative">
            <div className="relative flex-1">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
                <input 
                    type="text" 
                    placeholder="Rechercher une transaction..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1c1c1e] rounded-2xl py-5 pl-14 pr-8 text-base text-white border border-white/[0.06] outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#444] font-medium"
                />
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                        selectedCategoryId 
                        ? 'bg-accent-purple/10 border-accent-purple text-accent-purple shadow-[0_0_15px_rgba(140,141,250,0.2)]' 
                        : 'bg-[#1c1c1e] border-white/[0.06] text-[#8e8e93] hover:text-white'
                    }`}
                >
                    {selectedCategoryId ? <Tag size={20} /> : <Filter size={20} />}
                </button>

                <AnimatePresence>
                    {showFilterMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowFilterMenu(false)} 
                            />
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-72 bg-[#1c1c1e] border border-white/10 rounded-[32px] shadow-2xl z-20 overflow-hidden"
                            >
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <span className="text-[10px] font-black text-[#8e8e93] uppercase tracking-[0.2em] ml-2">Filtrer par catégorie</span>
                                    {(selectedCategoryId || selectedCategoryId === 'un-categorized') && (
                                        <button 
                                            onClick={() => {
                                                setSelectedCategoryId(null);
                                                setShowFilterMenu(false);
                                            }}
                                            className="text-xs font-bold text-accent-purple hover:underline"
                                        >
                                            Effacer
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto py-2 scroll-hide">
                                    <button
                                        onClick={() => {
                                            setSelectedCategoryId(null);
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-6 py-4 text-sm font-bold transition-colors flex items-center justify-between group ${!selectedCategoryId ? 'text-white bg-accent-purple/10' : 'text-[#8e8e93] hover:text-white hover:bg-white/5'}`}
                                    >
                                        TOUTES LES OPÉRATIONS
                                        {!selectedCategoryId && <Check size={16} className="text-accent-purple" />}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setSelectedCategoryId('un-categorized');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-6 py-4 text-sm font-bold transition-colors flex items-center justify-between group ${selectedCategoryId === 'un-categorized' ? 'text-white bg-accent-purple/10' : 'text-[#8e8e93] hover:text-white hover:bg-white/5'}`}
                                    >
                                        GÉNÉRAL (NON CLASSÉ)
                                        {selectedCategoryId === 'un-categorized' && <Check size={16} className="text-accent-purple" />}
                                    </button>

                                    <div className="h-px bg-white/5 mx-6 my-1" />

                                    {sortedCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategoryId(cat.id);
                                                setShowFilterMenu(false);
                                            }}
                                            className={`w-full text-left px-6 py-4 text-sm font-bold transition-colors flex items-center justify-between group ${selectedCategoryId === cat.id ? 'text-white bg-accent-purple/10' : 'text-[#8e8e93] hover:text-white hover:bg-white/5'}`}
                                        >
                                            {cat.name.toUpperCase()}
                                            {selectedCategoryId === cat.id && <Check size={16} className="text-accent-purple" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
          </div>

          {/* Monthly Tabs Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 scroll-hide animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {advanceTransactions.length > 0 && (
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 rounded-2xl border transition-all whitespace-nowrap font-bold text-sm ${
                  activeTab === 'upcoming' 
                  ? 'bg-accent-yellow/10 border-accent-yellow text-accent-yellow shadow-[0_0_15px_rgba(255,214,10,0.2)]' 
                  : 'bg-[#1c1c1e] border-white/[0.06] text-[#8e8e93] hover:text-white hover:border-white/10'
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
                  : 'bg-[#1c1c1e] border-white/[0.06] text-[#8e8e93] hover:text-white hover:border-white/10'
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

                  <div className="space-y-2 px-1">
                      {advanceTransactions.map((tx) => (
                        <SwipeableTransaction 
                          key={tx.id}
                          transaction={tx}
                          categories={categories}
                          onSelectCategory={(catId) => handleUpdateCategory(tx.id, catId)}
                          onRefresh={loadData}
                          updatingId={updatingId}
                        />
                      ))}
                  </div>
              </div>
          )}

          {/* Monthly Transaction List */}
          {activeTab !== 'upcoming' && groupedTx[activeTab] && (
              <div key={activeTab} className="space-y-8 animate-fade-in-up">
                  <div className="flex justify-between items-end px-4 pb-5 border-b border-white/5">
                      <h2 className="text-3xl font-bold text-white tracking-tight">{groupedTx[activeTab].label}</h2>
                      <span className="text-sm font-black text-[#8e8e93] uppercase tracking-[0.2em]">
                          TOTAL : {Math.abs(groupedTx[activeTab].total).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                      </span>
                  </div>
 
                  <div className="space-y-2 px-1">
                      {groupedTx[activeTab].txs.map((tx: any) => (
                        <SwipeableTransaction 
                          key={tx.id}
                          transaction={tx}
                          categories={categories}
                          onSelectCategory={(catId) => handleUpdateCategory(tx.id, catId)}
                          onRefresh={loadData}
                          updatingId={updatingId}
                        />
                      ))}
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
            <div className="space-y-4 animate-fade-in-up px-1">
              {filteredRegularTransactions.map((tx) => (
                <SwipeableTransaction 
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  onSelectCategory={(catId) => handleUpdateCategory(tx.id, catId)}
                  onRefresh={loadData}
                  updatingId={updatingId}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
