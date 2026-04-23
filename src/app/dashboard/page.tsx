'use client';

import { useState, useEffect } from 'react';
import { getBankAccountsAction } from '@/app/actions/accounts';
import { syncTransactionsAction } from '@/app/actions/bank';
import { RefreshCcw } from 'lucide-react';

export default function DashboardPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getBankAccountsAction().then((accounts) => {
      setBankAccounts(accounts || []);
      setLoading(false);
    });
  }, []);

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const formattedTotal = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBalance);

  const handleSync = async () => {
    setSyncing(true);
    await syncTransactionsAction();
    const accounts = await getBankAccountsAction();
    setBankAccounts(accounts || []);
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col items-center pt-8 pb-16 relative">
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="absolute top-0 right-0 p-2 text-[#8e8e93] hover:text-white transition-colors"
          title="Synchroniser"
        >
          <RefreshCcw size={20} className={syncing ? 'animate-spin' : ''} />
        </button>
        <span className="text-[#8e8e93] text-sm font-medium mb-3">Vous avez</span>
        <h1 className="text-6xl md:text-7xl font-semibold tracking-tighter text-white">
          {totalBalance < 0 ? '-' : ''}€{formattedTotal.replace('-', '')}
        </h1>
      </div>

      <div className="w-full max-w-md mx-auto space-y-10">
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg mb-2">Comptes Bancaires</h2>
          <div className="space-y-4">
            {bankAccounts.length === 0 ? (
              <p className="text-[#8e8e93] text-sm">Aucun compte connecté.</p>
            ) : (
              bankAccounts.map((acc) => {
                const isNegative = acc.balance < 0;
                return (
                  <div key={acc.id} className="flex justify-between items-center group cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-[#8e8e93] font-medium group-hover:text-white transition-colors">
                        {acc.name}
                      </span>
                      {acc.iban && (
                        <span className="text-[#8e8e93]/50 text-xs mt-0.5 font-mono">
                          {acc.iban.slice(0, 4)}...{acc.iban.slice(-4)}
                        </span>
                      )}
                    </div>
                    <span className={`font-medium ${isNegative ? 'text-red-400' : 'text-white'}`}>
                      €{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(acc.balance || 0)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
