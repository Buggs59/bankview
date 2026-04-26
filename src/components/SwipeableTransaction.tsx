'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { CreditCard, ArrowUpRight, RefreshCw, CircleDollarSign, Tag, Check, ChevronRight, Info, X } from 'lucide-react';

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
}

interface SwipeableTransactionProps {
  transaction: Transaction;
  categories: Category[];
  onSelectCategory: (categoryId: string | null) => void;
  updatingId?: string | null;
}

export default function SwipeableTransaction({ 
  transaction, 
  categories, 
  onSelectCategory,
  updatingId 
}: SwipeableTransactionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isSwiped, setIsSwiped] = useState(false);
  const controls = useAnimationControls();
  const txDate = new Date(transaction.date_real);
  const isSpending = transaction.amount < 0;

  const relevantCategories = categories
    .filter(cat => isSpending ? cat.families?.type === 'expense' : cat.families?.type === 'income')
    .sort((a, b) => a.name.localeCompare(b.name));

  // Ajout du bouton "Général" et répétition pour l'effet infini
  const baseOptions = [{ id: null, name: 'GÉNÉRAL' }, ...relevantCategories];
  // On répète la liste pour simuler l'infini
  const allOptions = [...baseOptions, ...baseOptions, ...baseOptions];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Centrer sur l'item sélectionné au montage ou quand on swipe
  useEffect(() => {
    if (isSwiped && scrollRef.current) {
      const index = baseOptions.findIndex(o => o.id === transaction.category_id);
      if (index !== -1) {
        // On se place sur la répétition du milieu
        const targetIndex = baseOptions.length + index;
        const targetScroll = targetIndex * 36 - (88 / 2 - 36 / 2);
        scrollRef.current.scrollTop = targetScroll;
      }
    }
  }, [isSwiped, transaction.category_id, baseOptions.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const itemHeight = 36;
    const listHeight = baseOptions.length * itemHeight;

    // Boucle infinie simple
    if (el.scrollTop < listHeight - 100) {
      el.scrollTop += listHeight;
    } else if (el.scrollTop > listHeight * 2) {
      el.scrollTop -= listHeight;
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -40) {
      setIsSwiped(true);
      controls.start({ x: -160 });
    } else if (info.offset.x > 40) {
      setIsSwiped(false);
      controls.start({ x: 0 });
    }
  };

  const selectCategory = (id: string | null) => {
    onSelectCategory(id);
    setIsSwiped(false);
    controls.start({ x: 0 });
  };

  const getIcon = (type?: string, color: string = 'text-accent-purple') => {
    if (!type) return null;
    const t = type.toUpperCase();
    if (t.startsWith('CB')) return <CreditCard size={14} className={`${color} opacity-60`} />;
    if (t === 'VIREMENT') return <ArrowUpRight size={14} className={`${color} opacity-60`} />;
    if (t === 'PRÉLÈVEMENT') return <RefreshCw size={14} className={`${color} opacity-60`} />;
    if (t === 'FRAIS') return <CircleDollarSign size={14} className={`${color} opacity-60`} />;
    return null;
  };

  const accentColor = transaction.is_advance ? 'text-accent-yellow' : 'text-accent-purple';
  const accentBorder = transaction.is_advance ? 'border-accent-yellow/20' : 'border-accent-purple/20';
  const accentHover = transaction.is_advance ? 'group-hover:border-accent-yellow' : 'group-hover:border-accent-purple/30';

  return (
    <div className="relative overflow-visible rounded-2xl mb-2 group h-[88px]">
      {/* Background Vertical Wheel Picker */}
      <div className="absolute inset-0 bg-gradient-to-l from-accent-purple/10 to-transparent flex items-center justify-end overflow-hidden rounded-2xl">
        <div className="w-[160px] h-full relative">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 flex flex-col py-[26px] overflow-y-auto scroll-hide snap-y snap-mandatory"
          >
            {allOptions.map((cat, i) => (
              <button
                key={`${cat.id || 'gen'}-${i}`}
                onClick={() => selectCategory(cat.id as any)}
                className={`w-full min-h-[36px] flex items-center justify-center px-4 snap-center transition-all duration-300 relative ${
                  transaction.category_id === cat.id 
                    ? 'text-accent-purple font-black scale-110' 
                    : 'text-[#8e8e93]/60 text-[11px] font-bold hover:text-white'
                }`}
              >
                <span className="truncate uppercase tracking-wider text-center">{cat.name}</span>
                {transaction.category_id === cat.id && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-accent-purple rounded-full shadow-[0_0_8px_rgba(140,141,250,0.8)]" />
                )}
              </button>
            ))}
          </div>
          {/* Overlay for wheel effect - Darker at edges for depth */}
          <div className="absolute top-0 left-0 right-0 h-[30px] pointer-events-none bg-gradient-to-b from-card to-transparent z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-[30px] pointer-events-none bg-gradient-to-t from-card to-transparent z-20" />
          {/* Center highlight area */}
          <div className="absolute top-1/2 left-4 right-4 h-[36px] -translate-y-1/2 border-y border-white/5 pointer-events-none" />
        </div>
      </div>

      {/* Main Content (Swipeable) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-card border border-white/5 h-full px-4 flex items-center gap-3 z-10 touch-pan-y active:cursor-grabbing shadow-lg rounded-2xl"
      >
        <div className={`w-12 h-12 rounded-2xl bg-card border ${accentBorder} flex flex-col items-center justify-center shrink-0 ${accentHover} transition-colors shadow-sm relative overflow-hidden`}>
            {transaction.is_advance && <div className="absolute inset-0 bg-accent-yellow/5 animate-pulse" />}
            <span className={`text-[8px] ${transaction.is_advance ? 'text-accent-yellow' : 'text-[#8e8e93]'} font-black uppercase tracking-widest relative z-10`}>
                {txDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').substring(0, 3)}
            </span>
            <span className="text-base text-white font-bold leading-none relative z-10">
                {txDate.getDate()}
            </span>
        </div>
        
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {getIcon(transaction.transaction_type, accentColor)}
                <h4 className="text-white text-[15px] font-semibold truncate group-hover:text-accent-purple transition-colors">
                    {transaction.clean_name || transaction.label}
                </h4>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(true);
                  }}
                  className="p-1 text-[#444] hover:text-accent-purple transition-colors shrink-0"
                >
                  <Info size={14} />
                </button>
            </div>
            <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${transaction.category_id ? 'text-accent-purple' : 'text-[#444]'}`}>
                    {baseOptions.find(c => c.id === transaction.category_id)?.name || 'GÉNÉRAL'}
                </span>
            </div>
        </div>

        <div className="text-right shrink-0">
            <p className={`text-lg font-bold ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
                {isSpending ? '' : '+'}{Math.abs(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
            </p>
            {isSwiped && (
               <motion.div 
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center justify-end text-accent-purple mt-1"
               >
                 <ChevronRight size={14} className="animate-bounce-x" />
               </motion.div>
            )}
        </div>
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl bg-white/5 border ${accentBorder}`}>
                      {getIcon(transaction.transaction_type, accentColor)}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">Détails de l'opération</h3>
                      <p className="text-[#8e8e93] text-sm">{txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDetails(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-[#8e8e93] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1">Libellé Nettoyé</p>
                    <p className="text-white font-semibold">{transaction.clean_name || 'Non défini'}</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1">Dénomination Bancaire (Brut)</p>
                    <p className="text-white/60 font-mono text-xs break-all leading-relaxed italic">{transaction.label}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1">Type</p>
                      <p className="text-white font-semibold">{transaction.transaction_type || 'Inconnu'}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <p className="text-[#8e8e93] text-[10px] font-black uppercase tracking-widest mb-1">Montant</p>
                      <p className={`text-lg font-bold ${!isSpending ? 'text-accent-green' : 'text-white'}`}>
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
                </div>

                <button 
                  onClick={() => setShowDetails(false)}
                  className="w-full mt-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-[#e5e5e5] transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
