'use client';

import { Card, Title, DonutChart, BarChart, Text, Metric, Flex, Badge, Grid } from '@tremor/react';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';

const mockDataFamilles = [
  { name: 'Charge fixe incompressible', value: 1250 },
  { name: 'Charge variable nécessaire', value: 450 },
  { name: 'Dépense ajustables', value: 300 },
  { name: 'Sorties/Loisir', value: 150 },
];

const mockDataEvolution = [
  { month: 'Jan', Dépenses: 2100, Revenus: 2500 },
  { month: 'Fév', Dépenses: 1900, Revenus: 2500 },
  { month: 'Mar', Dépenses: 2300, Revenus: 2500 },
  { month: 'Avr', Dépenses: 2150, Revenus: 2500 },
];

const valueFormatter = (number: number) => `€ ${Intl.NumberFormat('fr').format(number).toString()}`;

import { useState, useEffect } from 'react';
import { getBankAccountsAction } from '@/app/actions/accounts';
import { syncTransactionsAction } from '@/app/actions/bank';

export default function DashboardPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getBankAccountsAction().then(data => {
      setBankAccounts(data);
      setLoading(false);
    });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage('Synchronisation en cours...');
    const res = await syncTransactionsAction();
    setSyncing(false);
    if (res.error) {
      setMessage(`Erreur: ${res.error}`);
    } else {
      setMessage(`${res.count} transactions importées !`);
      // Rafraîchir les comptes (soldes)
      getBankAccountsAction().then(setBankAccounts);
    }
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Header section with KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Title className="text-3xl font-bold text-white">Bonjour Denis 👋</Title>
          <Text className="text-slate-400">Voici l'état de votre architecture budgétaire.</Text>
          {message && <Text className="text-indigo-400 mt-2 font-medium">{message}</Text>}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg active:scale-95"
          >
            <RefreshCcw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Importation...' : 'Actualiser mes banques'}
          </button>
          <button 
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            Gérer mes comptes
          </button>
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map((acc) => (
            <Card key={acc.id} className="bg-slate-900 border-slate-800 ring-0">
              <Text className="text-slate-400 text-xs uppercase tracking-wider">{acc.name}</Text>
              <Metric className="text-white text-xl mt-1">
                {acc.currency === 'EUR' ? '€' : acc.currency} {acc.balance || '0.00'}
              </Metric>
              <Text className="text-slate-500 text-xs mt-2 truncate">{acc.iban || 'Compte sans IBAN'}</Text>
            </Card>
          ))}
        </div>
      )}

      <Grid numItemsLg={3} className="gap-6">
        <Card className="bg-slate-900 border-slate-800 ring-0 shadow-xl" decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div>
              <Text className="text-slate-400">Total Entrées (Période)</Text>
              <Metric className="text-white font-bold">2 500 €</Metric>
            </div>
            <Badge icon={ArrowUpRight} color="emerald">
              Stable
            </Badge>
          </Flex>
        </Card>

        <Card className="bg-slate-900 border-slate-800 ring-0 shadow-xl" decoration="top" decorationColor="rose">
          <Flex alignItems="start">
            <div>
              <Text className="text-slate-400">Total Sorties (Période)</Text>
              <Metric className="text-white font-bold">2 150 €</Metric>
            </div>
            <Badge icon={ArrowDownLeft} color="rose">
              -12%
            </Badge>
          </Flex>
        </Card>

        <Card className="bg-slate-900 border-slate-800 ring-0 shadow-xl" decoration="top" decorationColor="indigo">
          <div>
            <Text className="text-slate-400">Solde Restant</Text>
            <Metric className="text-white font-bold">350 €</Metric>
          </div>
        </Card>
      </Grid>

      <Grid numItemsLg={2} className="gap-8">
        {/* Donut Chart for Categories */}
        <Card className="bg-slate-900 border-slate-800 ring-0">
          <Title className="text-white">Dépenses par Famille</Title>
          <DonutChart
            className="mt-6 h-72"
            data={mockDataFamilles}
            category="value"
            index="name"
            valueFormatter={valueFormatter}
            colors={['slate', 'violet', 'indigo', 'rose']}
            variant="donut"
          />
        </Card>

        {/* Bar Chart for Income vs Expenses */}
        <Card className="bg-slate-900 border-slate-800 ring-0">
          <Title className="text-white">Evolution Revenus vs Dépenses</Title>
          <BarChart
            className="mt-6 h-72"
            data={mockDataEvolution}
            index="month"
            categories={['Revenus', 'Dépenses']}
            colors={['emerald', 'rose']}
            valueFormatter={valueFormatter}
            yAxisWidth={48}
          />
        </Card>
      </Grid>
    </div>
  );
}
