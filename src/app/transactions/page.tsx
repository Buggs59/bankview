'use client';

import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { Search, ChevronDown, Calendar } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'W' | 'M' | 'Y'>('W');

  useEffect(() => {
    getTransactionsAction().then(data => {
      setTransactions(data || []);
      setLoading(false);
    });
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    (tx.label || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouping by Month
  const groupTransactionsByMonth = (txs: any[]) => {
    const groups: { [key: string]: { txs: any[], total: number } } = {};
    
    txs.forEach(tx => {
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
  };

  const groupedTx = groupTransactionsByMonth(filteredTransactions);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up">
      <h1 className="text-center text-xl font-bold text-white pt-4">Dépenses</h1>

      {/* Chart Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[#8e8e93] text-xs font-medium">7 derniers jours</span>
            <div className="text-4xl font-bold text-white">€865 <span className="text-[#34d399] text-sm">↑ 68%</span></div>
          </div>
          <div className="text-right">
            <span className="text-[#8e8e93] text-xs font-medium">Moyenne / jour</span>
            <div className="text-lg font-bold text-white">€124</div>
          </div>
        </div>

        {/* Bar Chart Mockup based on Billi */}
        <div className="h-40 flex items-end justify-between gap-1.5 px-2">
          {[20, 35, 90, 45, 30, 25, 20].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className={`w-full rounded-sm transition-all duration-700 ${i === 2 ? 'bg-[#8c8dfa]' : 'bg-[#2c2c2e]'}`} 
                style={{ height: `${h}%` }} 
              />
              <span className="text-[#8e8e93] text-[9px] uppercase">{['Sa', 'Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve'][i]}</span>
            </div>
          ))}
        </div>

        {/* Timeframe Toggle */}
        <div className="flex justify-center">
            <div className="bg-[#1c1c1e] p-1 rounded-full flex gap-1">
                {['W', 'M', 'Y'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTimeframe(t as any)}
                        className={`w-12 py-1.5 rounded-full text-xs font-bold transition-colors ${timeframe === t ? 'bg-[#2c2c2e] text-white' : 'text-[#8e8e93]'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Search and List */}
      <div className="space-y-6">
        <div className="flex items-center justify-end">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Rechercher" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1c1c1e] text-sm text-white rounded-full py-2 pl-4 pr-10 w-40 focus:w-60 transition-all outline-none border border-transparent focus:border-white/10"
                />
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
            </div>
        </div>

        <div className="space-y-8">
            {Object.keys(groupedTx).map((month, mIdx) => (
                <div key={month} className="space-y-4 animate-fade-in-up" style={{ animationDelay: `${(mIdx + 1) * 100}ms` }}>
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-[#8e8e93]" />
                            <h2 className="text-white font-bold">{month}</h2>
                        </div>
                        <span className={`font-bold ${groupedTx[month].total < 0 ? 'text-[#34d399]' : 'text-white'}`}>
                            {groupedTx[month].total > 0 ? '-' : '+'} €{Math.abs(groupedTx[month].total).toFixed(2)}
                            <ChevronDown size={14} className="inline ml-1 text-[#8e8e93]" />
                        </span>
                    </div>

                    <div className="space-y-1">
                        {groupedTx[month].txs.map((tx) => {
                            const isNegative = tx.amount < 0;
                            return (
                                <div key={tx.id} className="flex justify-between items-center py-3 px-2 rounded-2xl hover:bg-[#1c1c1e] transition-colors group">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium text-sm group-hover:text-[#8c8dfa] transition-colors">{tx.label}</span>
                                        {tx.is_advance && <span className="text-[#ffd60a] text-[10px] font-bold uppercase tracking-wider">Prévu</span>}
                                    </div>
                                    <span className={`text-sm font-bold ${!isNegative ? 'text-[#34d399]' : 'text-white'}`}>
                                        {isNegative ? '' : '+'}€{Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
