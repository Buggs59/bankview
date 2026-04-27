'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { CreditCard, ArrowUpRight, RefreshCw, CircleDollarSign, Tag, ChevronRight, Info, X, Link2, Unlink, Link, Check } from 'lucide-react';
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

// ─── Inline Drum Picker (Optimized for row height) ──────────────────────────
const INLINE_ITEM_HEIGHT = 32;

function InlineDrumPicker({
  items,
  selectedId,
  onSelect,
}: {
  items: { id: string | null; label: string }[];
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
}) {
  const selectedIndex = Math.max(0, items.findIndex(i => i.id === (selectedId ?? null)));
  const [offset, setOffset] = useState(-selectedIndex * INLINE_ITEM_HEIGHT);
  const startYRef = useRef<number | null>(null);
  const startOffsetRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const clampOffset = useCallback((raw: number) => {
    const min = -(items.length - 1) * INLINE_ITEM_HEIGHT;
    const max = 0;
    return Math.max(min, Math.min(max, raw));
  }, [items.length]);

  const snapToNearest = useCallback((raw: number) => {
    const clamped = clampOffset(raw);
    const idx = Math.round(-clamped / INLINE_ITEM_HEIGHT);
    const snapped = -idx * INLINE_ITEM_HEIGHT;
    setOffset(snapped);
    if (items[idx]?.id !== selectedId) {
      onSelect(items[idx]?.id ?? null);
    }
  }, [clampOffset, items, onSelect, selectedId]);

  // Handle external selection changes
  useEffect(() => {
    if (isDraggingRef.current) return;
    const idx = Math.max(0, items.findIndex(i => i.id === (selectedId ?? null)));
    setOffset(-idx * INLINE_ITEM_HEIGHT);
  }, [selectedId, items]);

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startOffsetRef.current = offset;
    isDraggingRef.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    setOffset(clampOffset(startOffsetRef.current + delta));
  };
  const onTouchEnd = () => {
    isDraggingRef.current = false;
    snapToNearest(offset);
  };

  return (
    <div 
      className="relative h-full w-[200px] bg-[#1a1b1e] overflow-hidden select-none touch-none cursor-ns-resize border-l border-white/5"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={(e) => {
        startYRef.current = e.clientY;
        startOffsetRef.current = offset;
        isDraggingRef.current = true;
        const move = (me: MouseEvent) => {
          if (!isDraggingRef.current || startYRef.current === null) return;
          const delta = me.clientY - startYRef.current;
          setOffset(clampOffset(startOffsetRef.current + delta));
        };
        const up = () => {
          isDraggingRef.current = false;
          snapToNearest(offset);
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      }}
    >
      {/* Center Highlight */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[32px] bg-accent-purple/10 pointer-events-none" />
      
      <motion.div
        animate={{ y: offset + (76 / 2) - (INLINE_ITEM_HEIGHT / 2) }} // 76 is row height approx
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="absolute w-full"
      >
        {items.map((item, idx) => {
          const distance = Math.abs(offset / INLINE_ITEM_HEIGHT + idx);
          const opacity = Math.max(0.15, 1 - distance * 0.5);
          const scale = Math.max(0.8, 1 - distance * 0.1);
          const isSelected = item.id === (selectedId ?? null);

          return (
            <div
              key={item.id ?? 'null'}
              className="w-full flex items-center justify-center px-4 transition-colors duration-300"
              style={{ height: INLINE_ITEM_HEIGHT }}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest truncate
                ${isSelected ? 'text-accent-purple' : 'text-[#555]'}
              `} style={{ opacity, transform: `scale(${scale})` }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* Fade Overlays */}
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#18181b] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#18181b] to-transparent pointer-events-none" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SwipeableTransaction({
  transaction,
  categories,
  onSelectCategory,
  onRefresh,
  updatingId,
}: SwipeableTransactionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const controls = useAnimationControls();
  const txDate = new Date(transaction.date_real);
  const isSpending = transaction.amount < 0;
  const isLinked = !!(transaction.link_id || transaction.linked_id);

  const accentColor = isSpending ? 'text-accent-red' : 'text-accent-green';
  const bgGradient = isSpending
    ? 'from-accent-red/20 to-accent-red/5'
    : 'from-accent-green/20 to-accent-green/5';

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.x < -60) {
      controls.start({ x: -200 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const selectCategory = (id: string | null) => {
    onSelectCategory(id);
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
      if (transaction.amount < 0) {
        setShowDetails(false);
      } else {
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

  const getIcon = (type?: string) => {
    if (!type) return null;
    const t = type.toUpperCase();
    if (t.includes('CB') || t.includes('CARTE')) return <CreditCard size={16} className={accentColor} />;
    if (t.includes('VIR')) return <ArrowUpRight size={16} className={accentColor} />;
    if (t.includes('PRLV')) return <RefreshCw size={16} className={accentColor} />;
    return <CircleDollarSign size={16} className={accentColor} />;
  };

  const currentCatName = categories.find(c => c.id === transaction.category_id)?.name;

  const pickerItems = useMemo(() => [
    { id: null, label: 'Général' },
    ...categories.map(c => ({ id: c.id, label: c.name }))
  ], [categories]);

  return (
    <>
      <div className="relative overflow-hidden rounded-[32px] group mb-2">
        {/* Swipe Background — Inline Drum Picker */}
        <div className="absolute inset-0 bg-[#18181b] flex items-center justify-end overflow-hidden">
          {/* Picker directly aligned to the right */}
          
          <InlineDrumPicker
            items={pickerItems}
            selectedId={transaction.category_id}
            onSelect={selectCategory}
          />
        </div>

        {/* Main Row */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -200, right: 0 }}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
          animate={controls}
          className={`relative flex items-center gap-4 px-5 py-4 active:cursor-grabbing cursor-grab
            bg-[#1c1c1e] border border-white/[0.06] 
            hover:border-white/[0.1] hover:bg-[#242426]
            transition-all duration-200
            ${isLinked ? 'opacity-50' : ''}
          `}
        >
          {/* Amount badge */}
          <div className={`min-w-[72px] h-12 px-4 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center shrink-0`}>
            <span className={`text-base font-black ${accentColor} leading-none whitespace-nowrap`}>
              {Math.abs(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {getIcon(transaction.transaction_type)}
              <span className={`text-[17px] font-bold truncate leading-tight tracking-tight
                ${isLinked ? 'text-[#555]' : 'text-[#e5e5e7] group-hover:text-white transition-colors'}
              `}>
                {transaction.clean_name || transaction.label}
              </span>
              {isLinked && <Link2 size={11} className="text-accent-purple/50 shrink-0" />}
              <button
                onClick={e => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  setShowDetails(true); 
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white transition-all shrink-0 ml-auto"
              >
                <Info size={15} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 opacity-60">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#8e8e93]">
                {new Date(transaction.date_real).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}
              </span>
              <span className="text-[#444] text-[8px]">•</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-accent-purple/80">
                {currentCatName || 'NON CLASSÉ'}
              </span>
            </div>
          </div>

          <ChevronRight size={14} className="text-[#2a2a2e] group-hover:text-[#555] transition-colors shrink-0" />
        </motion.div>
      </div>


      {/* Detail Modal */}
      <AnimatePresence>
        {(showDetails && mounted) && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#111214] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center`}>
                      {getIcon(transaction.transaction_type)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Détails de l'opération</h2>
                      <p className="text-[#555] text-sm uppercase font-black tracking-widest mt-1">
                        {txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetails(false)} className="p-3 bg-white/5 rounded-2xl text-[#555] hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/[0.04] p-5 rounded-3xl border border-white/[0.06]">
                    <p className="text-[#555] text-[10px] font-black uppercase tracking-widest mb-2">Libellé</p>
                    <p className="text-lg font-bold text-white leading-snug">{transaction.clean_name || transaction.label}</p>
                  </div>

                  <div className="bg-white/[0.04] p-4 rounded-3xl border border-white/[0.06]">
                    <p className="text-[#555] text-[10px] font-black uppercase tracking-widest mb-2">Dénomination bancaire</p>
                    <p className="text-xs font-mono text-[#555] break-all">{transaction.label}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.04] p-5 rounded-3xl border border-white/[0.06]">
                      <p className="text-[#555] text-[10px] font-black uppercase tracking-widest mb-2">Type</p>
                      <p className="text-base font-bold text-white">{transaction.transaction_type || 'Inconnu'}</p>
                    </div>
                    <div className="bg-white/[0.04] p-5 rounded-3xl border border-white/[0.06]">
                      <p className="text-[#555] text-[10px] font-black uppercase tracking-widest mb-2">Montant</p>
                      <p className={`text-2xl font-black ${accentColor}`}>
                        {transaction.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                      </p>
                    </div>
                  </div>

                  <div className="bg-accent-purple/[0.08] border border-accent-purple/20 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-accent-purple text-[10px] font-black uppercase tracking-widest mb-1">Catégorie</p>
                      <p className="text-white font-bold">{currentCatName || 'Général'}</p>
                    </div>
                    <Tag className="text-accent-purple/60" size={20} />
                  </div>

                  {/* Link section */}
                  <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Link2 size={13} className="text-accent-purple" />
                      <span className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em]">Compensation</span>
                    </div>

                    {isLinked ? (
                      <div className="bg-accent-green/[0.08] border border-accent-green/20 p-4 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-accent-green text-[10px] font-black uppercase tracking-widest mb-1">Compensé</p>
                            <p className="text-white font-bold text-sm">Opération neutralisée</p>
                          </div>
                          <div className="flex gap-2">
                            {transaction.amount > 0 && (
                              <button onClick={() => loadMatches()} className="p-3 bg-accent-purple/10 text-accent-purple rounded-xl hover:bg-accent-purple/20 transition-all" title="Ajouter une dépense">
                                <Link size={16} />
                              </button>
                            )}
                            <button onClick={handleUnlink} disabled={isLinking} className="p-3 bg-accent-red/10 text-accent-red rounded-xl hover:bg-accent-red/20 transition-all disabled:opacity-50" title="Dissocier">
                              <Unlink size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {(!isLinked || (transaction.amount > 0 && potentialMatches.length > 0)) && (
                      <div className="space-y-2">
                        {loadingMatches ? (
                          <div className="py-4 flex justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-purple" />
                          </div>
                        ) : potentialMatches.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-[10px] text-[#555] font-bold uppercase mb-2">
                              {transaction.amount > 0 ? 'Lier à une dépense :' : 'Correspondances :'}
                            </p>
                            {potentialMatches.map(m => (
                              <button
                                key={m.id}
                                onClick={() => handleLink(m.id)}
                                disabled={isLinking}
                                className="w-full bg-white/[0.04] border border-white/[0.06] p-3 rounded-xl flex items-center justify-between hover:bg-white/[0.08] hover:border-accent-purple/30 transition-all text-left"
                              >
                                <div className="min-w-0 pr-4">
                                  <p className="text-white text-xs font-bold truncate uppercase">{m.clean_name || m.label}</p>
                                  <p className="text-[10px] text-[#555]">{new Date(m.date_real).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {m.category?.name || 'GÉNÉRAL'}</p>
                                </div>
                                <span className={`text-xs font-bold shrink-0 ${m.amount > 0 ? 'text-accent-green' : 'text-white'}`}>
                                  {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString('fr-FR', { minimumFractionDigits: 0 })}€
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          !isLinked && <p className="text-xs text-[#444] italic text-center py-2">Aucun remboursement correspondant trouvé.</p>
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
    </>
  );
}
