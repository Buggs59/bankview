'use client';

import { 
  Card, 
  Title, 
  Text, 
  Table, 
  TableHead, 
  TableRow, 
  TableHeaderCell, 
  TableBody, 
  TableCell, 
  Badge, 
  TextInput,
  Flex,
  Metric,
  Grid
} from '@tremor/react';
import { Search, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getTransactionsAction } from '@/app/actions/bank';

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

  const totalDépenses = transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalRevenus = transactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <Title className="text-3xl font-bold text-white">Transactions</Title>
        <Text className="text-slate-400">Historique complet de vos mouvements bancaires.</Text>
      </div>

      <Grid numItemsLg={3} className="gap-6">
        <Card className="bg-slate-900 border-slate-800 ring-0 shadow-xl" decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div>
              <Text className="text-slate-400 text-xs uppercase tracking-wider">Total Revenus</Text>
              <Metric className="text-emerald-400 font-bold mt-1">{formatCurrency(totalRevenus)}</Metric>
            </div>
            <ArrowUpRight className="text-emerald-500" size={24} />
          </Flex>
        </Card>

        <Card className="bg-slate-900 border-slate-800 ring-0 shadow-xl" decoration="top" decorationColor="rose">
          <Flex alignItems="start">
            <div>
              <Text className="text-slate-400 text-xs uppercase tracking-wider">Total Dépenses</Text>
              <Metric className="text-rose-400 font-bold mt-1">{formatCurrency(totalDépenses)}</Metric>
            </div>
            <ArrowDownLeft className="text-rose-500" size={24} />
          </Flex>
        </Card>

        <Card className="bg-slate-900 border-slate-800 ring-0 shadow-xl" decoration="top" decorationColor="indigo">
          <Flex alignItems="start">
            <div>
              <Text className="text-slate-400 text-xs uppercase tracking-wider">Transactions</Text>
              <Metric className="text-indigo-400 font-bold mt-1">{transactions.length}</Metric>
            </div>
            <Calendar className="text-indigo-500" size={24} />
          </Flex>
        </Card>
      </Grid>

      <Card className="bg-slate-900 border-slate-800 ring-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Title className="text-white">Liste des opérations</Title>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={18} />
            <TextInput
              placeholder="Rechercher une transaction..."
              className="pl-10 bg-slate-950 border-slate-800 text-white rounded-xl"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <Table className="mt-4">
            <TableHead>
              <TableRow className="border-slate-800">
                <TableHeaderCell className="text-slate-400">Date</TableHeaderCell>
                <TableHeaderCell className="text-slate-400">Libellé</TableHeaderCell>
                <TableHeaderCell className="text-slate-400 text-right">Montant</TableHeaderCell>
                <TableHeaderCell className="text-slate-400 text-center">Statut</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((item) => (
                <TableRow key={item.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="text-slate-300 text-sm">
                    {formatDate(item.date_real)}
                  </TableCell>
                  <TableCell>
                    <Text className="text-white font-medium max-w-xs md:max-w-md truncate">
                      {item.label}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <Text className={`font-bold ${item.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge color={item.amount < 0 ? 'rose' : 'emerald'} className="bg-opacity-10 border-none rounded-lg text-[10px] uppercase">
                      {item.amount < 0 ? 'Sortie' : 'Entrée'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-20">
            <Text className="text-slate-500">Aucune transaction trouvée.</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
