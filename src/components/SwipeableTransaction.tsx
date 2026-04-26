'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { CreditCard, ArrowUpRight, RefreshCw, CircleDollarSign, Tag, Check, ChevronRight, Info, X, Link2, Unlink, Link } from 'lucide-react';
import { getMatchableTransactionsAction, linkTransactionsAction, unlinkTransactionAction } from '@/app/actions/bank';

interface Category {
  id: string;
  name: string;
  icon?: string;
  families?: {
    type: 'expense' | 'income';
  };
}

interface Transaction {
  id: string;
  label: string;
  clean_name?: string;
  amount: number;
  date_real: string;
  transaction_type?: string;
  category_id?: string | null;
  is_advance?: boolean;
  linked_id?: string | null;
  link_id?: string | null;
  category?: { name: string };
}

interface SwipeableTransactionProps {
  transaction: Transaction;
  categories: Category[];
  onSelectCategory: (categoryId: string | null) => void;
  onRefresh?: () => void;
  updatingId?: string | null;
}

export default function SwipeableTransaction({ 
  transaction, 
  categories, 
  onSelectCategory,
  onRefresh,
  updatingId 
}: SwipeableTransactionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isSwiped, setIsSwiped] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const controls = useAnimationControls();
  const txDate = new Date(transaction.date_real);
  const isSpending = transaction.amount < 0;
  
  const accentColor = isSpending ? 'text-accent-red' : 'text-accent-green';
  const bgColor = isSpending ? 'bg-accent-red/10' : 'bg-accent-green/10';

  const baseOptions = categories;

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -100) {
      setIsSwiped(true);
      controls.start({ x: -280 });
    } else {
      setIsSwiped(false);
      controls.start({ x: 0 });
    }
  };

  const selectCategory = (id: string | null) => {
    onSelectCategory(id);
    setIsSwiped(false);
    controls.start({ x: 0 });
  };

  useEffect(() => {
    if (showDetails && !transaction.link_id) {
      loadMatches();
    }
  }, [showDetails, transaction.link_id]);

  async function loadMatches() {
    setLoadingMatches(true);
    const matches = await getMatchableTransactionsAction(transaction.id);
    setPotentialMatches(matches);
    setLoadingMatches(false);
  }

  const handleLink = async (targetId: string) => {
    setIsLinking(true);
    const res = await linkTransactionsAction(transaction.id, targetId);
    if (res.success) {
      if (onRefresh) onRefresh();
      // Don't close modal to allow multiple links if it's a reimbursement
      if (transaction.amount < 0) {
        setShowDetails(false);
      } else {
        // Refresh matches
        loadMatches();
      }
    } else {
      alert(res.error);
    }
    setIsLinking(false);
  };

  const handleUnlink = async () => {
    setIsLinking(true);
    const res = await unlinkTransactionAction(transaction.id);
    if (res.success) {
      if (onRefresh) onRefresh();
      setShowDetails(false);
    } else {
      alert(res.error);
    }
    setIsLinking(false);
  };

  const getIcon = (type?: string, color: string = 'text-accent-purple') => {
    if (!type) return null;
    const t = type.toUpperCase();
    if (t.includes('CB') || t.includes('CARTE')) return <CreditCard size={14} className={color} />;
    if (t.includes('VIR')) return <ArrowUpRight size={14} className={color} />;
    if (t.includes('PRLV')) return <RefreshCw size={14} className={color} />;
    return <CircleDollarSign size={14} className={color} />;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl group mb-2">
      {/* Background/Action Layer */}
      <div className="absolute inset-0 bg-[#1c1c1e] flex items-center justify-end px-6 gap-3">
        <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-black text-[#444] uppercase tracking-widest mb-1">Catégories</span>
            <div className="flex gap-2">
                {baseOptions.slice(0, 4).map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => selectCategory(cat.id)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-accent-purple/20 hover:border-accent-purple/30 transition-all text-white/40 hover:text-white"
                        title={cat.name}
                    >
                        <Tag size={18} />
                    </button>
                ))}
                <button
                    onClick={() => selectCategory(null)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-accent-red/20 hover:border-accent-red/30 transition-all text-white/40 hover:text-white"
                    title="Général"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* Main Row Layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -280, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-card border border-white/5 p-4 flex items-center gap-4 active:cursor-grabbing hover:bg-white/[0.02] transition-colors rounded-2xl z-10"
      >
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center shrink-0 shadow-inner border border-white/5`}>
            <span className={`text-lg font-black ${accentColor}`}>
                {transaction.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 }).replace('-', '')}
            </span>
        </div>

        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {getIcon(transaction.transaction_type, accentColor)}
                <h4 className={`text-[15px] font-semibold truncate transition-colors ${(transaction.link_id || transaction.linked_id) ? 'text-[#8e8e93]' : 'text-white group-hover:text-accent-purple'}`}>
                    {transaction.clean_name || transaction.label}
                </h4>
                {(transaction.link_id || transaction.linked_id) && <Link2 size={12} className="text-accent-purple shrink-0" />}
                
                <button 
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white transition-all shrink-0 ml-1"
                >
                  <Info size={14} />
                </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-black text-[#444] uppercase tracking-[0.2em]">
                    {txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <div className="px-2.5 py-0.5 rounded-full bg-accent-purple/10 border border-accent-purple/20">
                  <span className="text-[9px] font-black text-accent-purple uppercase tracking-wider">
                      {baseOptions.find(c => c.id === transaction.category_id)?.name || 'GÉNÉRAL'}
                  </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <ChevronRight size={16} className="text-[#222] group-hover:text-accent-purple transition-colors" />
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetails && createPortal(
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#1c1c1e] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${bgColor} flex items-center justify-center`}>
                        {getIcon(transaction.transaction_type, accentColor)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Détails de l'opération</h2>
                        <p className="text-[#8e8e93] text-sm uppercase font-black tracking-widest mt-1">
                          {txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setShowDetails(false)} className="p-3 bg-white/5 rounded-2xl text-[#8e8e93] hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-2">Libellé Nettoyé</p>
                      <p className="text-xl font-bold text-white leading-tight">{transaction.clean_name || transaction.label}</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                      <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-2">Dénomination bancaire (Brut)</p>
                      <p className="text-xs font-mono text-[#8e8e93] break-all">{transaction.label}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-2">Type</p>
                        <p className="text-lg font-bold text-white">{transaction.transaction_type || 'Inconnu'}</p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-2">Montant</p>
                        <p className={`text-2xl font-black ${accentColor}`}>
                          {transaction.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </p>
                      </div>
                    </div>

                    <div className="bg-accent-purple/10 border border-accent-purple/20 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-accent-purple text-[10px] font-black uppercase tracking-widest mb-1">Catégorie</p>
                        <p className="text-white font-bold">
                          {baseOptions.find(c => c.id === transaction.category_id)?.name || 'GÉNÉRAL'}
                        </p>
                      </div>
                      <Tag className="text-accent-purple" size={24} />
                    </div>

                    {/* LIEN / COMPENSATION */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 size={14} className="text-accent-purple" />
                        <span className="text-[10px] font-black text-[#8e8e93] uppercase tracking-[0.2em]">Compensation Multi-liens</span>
                      </div>

                      {(transaction.link_id || transaction.linked_id) ? (
                        <div className="bg-accent-green/10 border border-accent-green/20 p-4 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-accent-green text-[10px] font-black uppercase tracking-widest mb-1">Compensé / Annulé</p>
                              <p className="text-white font-bold text-sm">Cette opération fait partie d'un groupe de compensation.</p>
                            </div>
                            <div className="flex gap-2">
                              {transaction.amount > 0 && (
                                <button 
                                  onClick={() => loadMatches()}
                                  className="p-3 bg-accent-purple/10 text-accent-purple rounded-xl hover:bg-accent-purple/20 transition-all"
                                  title="Ajouter une autre dépense"
                                >
                                  <Link size={18} />
                                </button>
                              )}
                              <button 
                                onClick={handleUnlink}
                                disabled={isLinking}
                                className="p-3 bg-accent-red/10 text-accent-red rounded-xl hover:bg-accent-red/20 transition-all disabled:opacity-50"
                                title="Dissocier"
                              >
                                <Unlink size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Matching Section */}
                      {(!(transaction.link_id || transaction.linked_id) || (transaction.amount > 0 && potentialMatches.length > 0)) && (
                        <div className="space-y-3">
                          {loadingMatches ? (
                            <div className="py-4 flex justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-purple" />
                            </div>
                          ) : potentialMatches.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-[10px] text-[#444] font-bold uppercase mb-2">
                                {transaction.amount > 0 ? 'Lier à une dépense supplémentaire :' : 'Correspondances suggérées :'}
                              </p>
                              {potentialMatches.map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => handleLink(m.id)}
                                  disabled={isLinking}
                                  className="w-full bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:bg-white/[0.08] hover:border-accent-purple/30 transition-all group/match text-left"
                                >
                                  <div className="min-w-0 pr-4">
                                    <p className="text-white text-xs font-bold truncate uppercase">{m.clean_name || m.label}</p>
                                    <p className="text-[10px] text-[#8e8e93]">{new Date(m.date_real).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {m.category?.name || 'GÉNÉRAL'}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs font-bold ${m.amount > 0 ? 'text-accent-green' : 'text-white'}`}>
                                      {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                                    </span>
                                    <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple opacity-0 group-hover/match:opacity-100 transition-all">
                                      <Link size={14} />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            !(transaction.link_id || transaction.linked_id) && <p className="text-xs text-[#444] italic text-center py-2">Aucun remboursement correspondant trouvé.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowDetails(false)}
                    className="w-full py-5 bg-white text-black font-black rounded-3xl hover:bg-[#eee] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
                  >
                    Fermer
                  </button>
              </div>
            </motion.div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
