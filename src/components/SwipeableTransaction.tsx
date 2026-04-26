'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { CreditCard, ArrowUpRight, RefreshCw, CircleDollarSign, Tag, Check, ChevronRight } from 'lucide-react';

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
  const [isSwiped, setIsSwiped] = useState(false);
  const controls = useAnimationControls();
  const txDate = new Date(transaction.date_real);
  const isSpending = transaction.amount < 0;

  // Filtrer les catégories par type (dépense ou revenu)
  const relevantCategories = categories.filter(cat => {
    return isSpending ? cat.families?.type === 'expense' : cat.families?.type === 'income';
  });

  // Limiter à 5 catégories pour la roue + 1 bouton "Général"
  const topCategories = relevantCategories.slice(0, 5);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -50) {
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
  const accentBg = transaction.is_advance ? 'bg-accent-yellow/5' : 'bg-accent-purple/5';
  const accentHover = transaction.is_advance ? 'group-hover:border-accent-yellow' : 'group-hover:border-accent-purple/30';

  return (
    <div className="relative overflow-hidden rounded-2xl mb-2 group">
      {/* Background Wheel / Menu */}
      <div className="absolute inset-0 bg-gradient-to-l from-accent-purple/20 to-transparent flex items-center justify-end pr-4">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isSwiped && (
              <>
                <motion.button
                  initial={{ scale: 0, opacity: 0, x: 20 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  exit={{ scale: 0, opacity: 0, x: 20 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => selectCategory(null)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                    !transaction.category_id ? 'bg-accent-purple border-accent-purple text-white shadow-lg' : 'bg-white/5 border-white/10 text-[#8e8e93]'
                  }`}
                >
                  <Tag size={18} />
                </motion.button>

                {topCategories.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ scale: 0, opacity: 0, x: 20, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, x: 20, rotate: -20 }}
                    transition={{ delay: (i + 1) * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => selectCategory(cat.id)}
                    className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border transition-all relative group/btn ${
                      transaction.category_id === cat.id ? 'bg-accent-purple border-accent-purple text-white shadow-lg' : 'bg-white/5 border-white/10 text-[#8e8e93]'
                    }`}
                  >
                    <span className="text-[10px] font-bold truncate w-full px-1 text-center">
                      {cat.name.substring(0, 3).toUpperCase()}
                    </span>
                    {transaction.category_id === cat.id && (
                      <div className="absolute -top-1 -right-1 bg-accent-green rounded-full p-0.5">
                        <Check size={8} className="text-white" />
                      </div>
                    )}
                    
                    {/* Tooltip-like label on hover/active */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                      {cat.name}
                    </div>
                  </motion.button>
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content (Swipeable) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -280, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-card border border-white/5 p-4 rounded-2xl flex items-center gap-3 z-10 touch-pan-y active:cursor-grabbing"
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
            </div>
            <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${transaction.category_id ? 'text-accent-purple' : 'text-[#444]'}`}>
                    {categories.find(c => c.id === transaction.category_id)?.name || 'GÉNÉRAL'}
                </span>
                {transaction.is_advance && (
                    <span className="text-accent-yellow text-[9px] font-black uppercase bg-accent-yellow/10 px-1.5 py-0.5 rounded">
                        PRÉVU
                    </span>
                )}
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
    </div>
  );
}
