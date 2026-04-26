'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { CreditCard, ArrowUpRight, RefreshCw, CircleDollarSign, Tag, ChevronRight, Info, X, Link2, Unlink, Link } from 'lucide-react';
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

// ─── Drum/Cylinder Picker ────────────────────────────────────────────────────
const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;

function DrumPicker({
  items,
  selectedId,
  onSelect,
}: {
  items: { id: string | null; label: string }[];
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
}) {
  const selectedIndex = Math.max(0, items.findIndex(i => i.id === (selectedId ?? null)));
  const [offset, setOffset] = useState(-selectedIndex * ITEM_HEIGHT);
  const startYRef = useRef<number | null>(null);
  const startOffsetRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const clampOffset = useCallback((raw: number) => {
    const min = -(items.length - 1) * ITEM_HEIGHT;
    const max = 0;
    return Math.max(min, Math.min(max, raw));
  }, [items.length]);

  const snapToNearest = useCallback((raw: number) => {
    const clamped = clampOffset(raw);
    const idx = Math.round(-clamped / ITEM_HEIGHT);
    const snapped = -idx * ITEM_HEIGHT;
    setOffset(snapped);
    onSelect(items[idx]?.id ?? null);
  }, [clampOffset, items, onSelect]);

  // Touch events
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

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    startYRef.current = e.clientY;
    startOffsetRef.current = offset;
    isDraggingRef.current = true;
  };
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || startYRef.current === null) return;
      const delta = e.clientY - startYRef.current;
      setOffset(clampOffset(startOffsetRef.current + delta));
    };
    const onMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        snapToNearest(offset);
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [offset, snapToNearest, clampOffset]);

  const center = Math.floor(VISIBLE_ITEMS / 2); // 2

  return (
    <div
      className="relative select-none overflow-hidden"
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      {/* Gradient masks */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 z-10"
        style={{ background: 'linear-gradient(to bottom, #111214 0%, transparent 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 z-10"
        style={{ background: 'linear-gradient(to top, #111214 0%, transparent 100%)' }} />

      {/* Selection highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl border border-accent-purple/40 bg-accent-purple/10"
        style={{
          top: center * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        }}
      />

      {/* Drum items */}
      <div
        className="absolute inset-x-0 cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateY(${offset + center * ITEM_HEIGHT}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {items.map((item, idx) => {
          const distance = Math.abs(idx - Math.round(-offset / ITEM_HEIGHT));
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.55 : 0.22;
          const scale = distance === 0 ? 1 : distance === 1 ? 0.92 : 0.84;
          return (
            <div
              key={item.id ?? 'null'}
              style={{
                height: ITEM_HEIGHT,
                opacity,
                transform: `scale(${scale})`,
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              className="flex items-center justify-center px-6"
              onClick={() => {
                const snapped = -idx * ITEM_HEIGHT;
                setOffset(snapped);
                onSelect(item.id);
              }}
            >
              <span className={`font-bold text-[15px] truncate max-w-full text-center ${distance === 0 ? 'text-white' : 'text-[#8e8e93]'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category Picker Modal ────────────────────────────────────────────────────
function CategoryPickerModal({
  categories,
  currentCategoryId,
  onSelect,
  onClose,
}: {
  categories: Category[];
  currentCategoryId: string | null | undefined;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(currentCategoryId ?? null);
  
  const items = [
    { id: null, label: '— Général —' },
    ...categories.map(c => ({ id: c.id, label: c.name })),
  ];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-sm bg-[#111214] rounded-t-[40px] sm:rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-6 pb-2">
          <h3 className="text-lg font-black text-white text-center">Catégorie</h3>
          <p className="text-[11px] text-[#555] uppercase tracking-widest font-bold text-center mt-1">
            Faites défiler pour choisir
          </p>
        </div>

        {/* Drum Picker */}
        <DrumPicker
          items={items}
          selectedId={selected}
          onSelect={setSelected}
        />

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl bg-white/5 text-[#8e8e93] font-bold text-sm hover:bg-white/10 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={() => { onSelect(selected); onClose(); }}
            className="flex-2 flex-1 py-4 rounded-2xl bg-accent-purple text-white font-black text-sm hover:bg-accent-purple/90 transition-all shadow-[0_0_20px_rgba(140,141,250,0.4)]"
          >
            Confirmer
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
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
  const [showPicker, setShowPicker] = useState(false);
  const [isSwiped, setIsSwiped] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const controls = useAnimationControls();
  const txDate = new Date(transaction.date_real);
  const isSpending = transaction.amount < 0;
  const isLinked = !!(transaction.link_id || transaction.linked_id);

  const accentColor = isSpending ? 'text-accent-red' : 'text-accent-green';
  const bgGradient = isSpending
    ? 'from-accent-red/20 to-accent-red/5'
    : 'from-accent-green/20 to-accent-green/5';

  const handleDragEnd = (_event: any, info: any) => {
    if (info.offset.x < -80) {
      setIsSwiped(true);
      controls.start({ x: -180 });
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

  const handleOpenPicker = () => {
    setIsSwiped(false);
    controls.start({ x: 0 });
    setShowPicker(true);
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
    if (t.includes('CB') || t.includes('CARTE')) return <CreditCard size={13} className={accentColor} />;
    if (t.includes('VIR')) return <ArrowUpRight size={13} className={accentColor} />;
    if (t.includes('PRLV')) return <RefreshCw size={13} className={accentColor} />;
    return <CircleDollarSign size={13} className={accentColor} />;
  };

  const currentCatName = categories.find(c => c.id === transaction.category_id)?.name;

  return (
    <>
      <div className="relative overflow-hidden rounded-[22px] group mb-2">
        {/* Swipe Background — Drum Picker trigger */}
        <div className="absolute inset-0 bg-[#18181b] flex items-center justify-end">
          <button
            onClick={handleOpenPicker}
            className="h-full px-8 flex flex-col items-center justify-center gap-2 text-accent-purple hover:bg-accent-purple/10 transition-colors"
          >
            <Tag size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest text-accent-purple/60">
              Classer
            </span>
          </button>
        </div>

        {/* Main Row */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -180, right: 0 }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          animate={controls}
          className={`relative flex items-center gap-4 px-4 py-3.5 active:cursor-grabbing cursor-grab
            bg-[#17171a] border border-white/[0.06] 
            hover:border-white/[0.1] hover:bg-[#1d1d20]
            transition-all duration-200
            ${isLinked ? 'opacity-50' : ''}
          `}
        >
          {/* Amount badge */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${bgGradient} flex items-center justify-center shrink-0`}>
            <span className={`text-[13px] font-black ${accentColor} leading-none`}>
              {Math.abs(transaction.amount).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {getIcon(transaction.transaction_type)}
              <span className={`text-[14px] font-semibold truncate leading-tight
                ${isLinked ? 'text-[#555]' : 'text-[#e5e5e7] group-hover:text-white transition-colors'}
              `}>
                {transaction.clean_name || transaction.label}
              </span>
              {isLinked && <Link2 size={11} className="text-accent-purple/50 shrink-0" />}
              <button
                onClick={e => { e.stopPropagation(); setShowDetails(true); }}
                className="p-1 rounded-lg hover:bg-white/10 text-[#444] hover:text-[#8e8e93] transition-colors shrink-0"
              >
                <Info size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-[#3a3a3d] uppercase tracking-widest">
                {txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
              {currentCatName && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-[#3a3a3d]" />
                  <span className="text-[10px] font-bold text-accent-purple/50 uppercase tracking-wider">
                    {currentCatName}
                  </span>
                </>
              )}
            </div>
          </div>

          <ChevronRight size={14} className="text-[#2a2a2e] group-hover:text-[#555] transition-colors shrink-0" />
        </motion.div>
      </div>

      {/* Category Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <CategoryPickerModal
            categories={categories}
            currentCategoryId={transaction.category_id}
            onSelect={selectCategory}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetails && createPortal(
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
