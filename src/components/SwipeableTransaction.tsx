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

  const relevantCategories = categories.filter(cat => {
    return isSpending ? cat.families?.type === 'expense' : cat.families?.type === 'income';
  });

  // Ajout du bouton "Général" au début
  const allOptions = [{ id: null, name: 'GÉNÉRAL' }, ...relevantCategories];

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
    <div className="relative overflow-hidden rounded-2xl mb-2 group h-[88px]">
      {/* Background Vertical Wheel Picker */}
      <div className="absolute inset-0 bg-gradient-to-l from-accent-purple/10 to-transparent flex items-center justify-end overflow-hidden">
        <div className="w-[160px] h-full relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center py-2 overflow-y-auto scroll-hide snap-y snap-mandatory">
            {allOptions.map((cat, i) => (
              <button
                key={cat.id || 'general'}
                onClick={() => selectCategory(cat.id as any)}
                className={`w-full min-h-[34px] flex items-center justify-center px-4 snap-center transition-all duration-300 ${
                  transaction.category_id === cat.id 
                    ? 'text-accent-purple font-black scale-110' 
                    : 'text-[#8e8e93]/50 text-[10px] font-bold hover:text-white'
                }`}
              >
                <span className="truncate uppercase tracking-wider">{cat.name}</span>
                {transaction.category_id === cat.id && <div className="ml-2 w-1.5 h-1.5 bg-accent-purple rounded-full shadow-[0_0_8px_rgba(140,141,250,0.8)]" />}
              </button>
            ))}
          </div>
          {/* Overlay for wheel effect */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-card via-transparent to-card opacity-80" />
        </div>
      </div>

      {/* Main Content (Swipeable) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-card border border-white/5 h-full px-4 flex items-center gap-3 z-10 touch-pan-y active:cursor-grabbing shadow-lg"
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
            <div className="flex items-center gap-3 mt-1">
                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${transaction.category_id ? 'text-accent-purple' : 'text-[#444]'}`}>
                    {allOptions.find(c => c.id === transaction.category_id)?.name || 'GÉNÉRAL'}
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
    </div>
  );
}
