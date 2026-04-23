'use client';

import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';
import { Search } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getTransactionsAction().then(data => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Last 7 Days spending
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const last7DaysTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date_real);
    return tx.amount < 0 && !tx.is_advance && txDate >= sevenDaysAgo && txDate <= today;
  });

  const last7DaysTotal = last7DaysTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Group by day for the chart
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const dayStr = d.toISOString().split('T')[0];
    const total = last7DaysTransactions
      .filter(tx => tx.date_real.startsWith(dayStr))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return {
      label: days[d.getDay()],
      date: d.getDate(),
      total
    };
  });

  const maxTotal = Math.max(...chartData.map(d => d.total), 1); // prevent div by zero

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      dayStr: d.getDate().toString().padStart(2, '0'),
      monthStr: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-md mx-auto w-full space-y-8">
      
      {/* Spending Chart Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-[#8e8e93] text-sm font-medium mb-1">Dépenses 7 derniers jours</h2>
            <div className="text-4xl font-semibold text-white tracking-tight">
              €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(last7DaysTotal)}
            </div>
          </div>
        </div>

        <div className="h-40 flex items-end justify-between gap-2 pt-4">
          {chartData.map((data, idx) => {
            const heightPercent = (data.total / maxTotal) * 100;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 gap-2 group relative">
                {/* Tooltip */}
                <div className="absolute -top-8 bg-[#2c2c2e] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  €{data.total.toFixed(0)}
                </div>
                {/* Bar */}
                <div className="w-full flex justify-center items-end h-full">
                  <div 
                    className="w-full max-w-[24px] bg-[#8c8dfa] rounded-sm transition-all duration-500 ease-out"
                    style={{ height: `${Math.max(heightPercent, 4)}%` }} // min height 4% to show it exists
                  />
                </div>
                {/* Labels */}
                <div className="text-center">
                  <div className="text-[#8e8e93] text-[10px] font-medium uppercase">{data.label.charAt(0)}</div>
                  <div className="text-white text-xs font-semibold">{data.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Récent</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8e8e93]" size={14} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1c1c1e] text-sm text-white rounded-full pl-8 pr-4 py-1.5 border border-white/5 focus:outline-none focus:border-[#8c8dfa]/50 transition-colors placeholder:text-[#8e8e93]/50 w-32 focus:w-48"
            />
          </div>
        </div>

        <div className="space-y-1">
          {filteredTransactions.length === 0 ? (
            <p className="text-[#8e8e93] text-sm py-4 text-center">Aucune transaction trouvée.</p>
          ) : (
            filteredTransactions.map((tx) => {
              const date = formatDate(tx.date_real);
              const isNegative = tx.amount < 0;
              return (
                <div key={tx.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-[#1c1c1e] px-2 -mx-2 rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center w-10 text-center">
                      <span className="text-[#8e8e93] text-xs font-medium uppercase">{date.monthStr}</span>
                      <span className="text-white font-semibold text-sm">{date.dayStr}</span>
                    </div>
                    {/* Label & Badges */}
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-sm line-clamp-1">{tx.label}</span>
                      <div className="flex gap-2 mt-0.5">
                        {tx.is_advance && (
                          <span className="text-[#ffd60a] text-[10px] font-semibold uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd60a]"></span> Prévu
                          </span>
                        )}
                        {!isNegative && !tx.is_advance && (
                          <span className="text-[#34d399] text-[10px] font-semibold uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]"></span> Revenu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Amount */}
                  <span className={`font-semibold text-sm ${!isNegative ? 'text-[#34d399]' : 'text-white'}`}>
                    {isNegative ? '' : '+'}€{Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
}
