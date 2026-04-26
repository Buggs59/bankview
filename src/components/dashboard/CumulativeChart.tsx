'use client';

import { useMemo } from 'react';
import { AreaChart, Card, Title, Text } from '@tremor/react';

interface CumulativeChartProps {
  transactions: any[];
}

export default function CumulativeChart({ transactions }: CumulativeChartProps) {
  const chartData = useMemo(() => {
    // 1. Filter out linked/internal transactions
    const filtered = transactions.filter(tx => !tx.link_id && !tx.linked_id && !tx.is_advance);
    
    // 2. Sort by date ascending
    const sorted = [...filtered].sort((a, b) => new Date(a.date_real).getTime() - new Date(b.date_real).getTime());
    
    // 3. Last 30 days range
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const relevantTx = sorted.filter(tx => new Date(tx.date_real) >= thirtyDaysAgo);
    
    // 4. Group by day and calculate cumulative
    const dataByDay: Record<string, { date: string, income: number, expense: number }> = {};
    
    // Initialize all 30 days
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      dataByDay[key] = { date: label, income: 0, expense: 0 };
    }
    
    let cumIncome = 0;
    let cumExpense = 0;
    
    // Fill data
    relevantTx.forEach(tx => {
      const key = tx.date_real.split('T')[0];
      if (dataByDay[key]) {
        if (tx.amount > 0) cumIncome += tx.amount;
        else cumExpense += Math.abs(tx.amount);
      }
    });

    // Final pass for cumulative
    let currentCumIncome = 0;
    let currentCumExpense = 0;
    
    return Object.entries(dataByDay).sort().map(([key, val]) => {
      // Find transactions for this specific day to add to cumulative
      const dayTxs = relevantTx.filter(tx => tx.date_real.split('T')[0] === key);
      dayTxs.forEach(tx => {
        if (tx.amount > 0) currentCumIncome += tx.amount;
        else currentCumExpense += Math.abs(tx.amount);
      });
      
      return {
        date: val.date,
        "Entrées": Math.round(currentCumIncome),
        "Dépenses": Math.round(currentCumExpense)
      };
    });
  }, [transactions]);

  return (
    <Card className="bg-card/40 backdrop-blur-md border-white/5 rounded-[48px] p-10 shadow-2xl">
      <div className="mb-8">
        <Title className="text-white text-xl font-bold tracking-tight">Flux Cumulés</Title>
        <Text className="text-[#8e8e93] text-sm opacity-60">Évolution sur les 30 derniers jours</Text>
      </div>
      <AreaChart
        className="h-72 mt-4"
        data={chartData}
        index="date"
        categories={["Entrées", "Dépenses"]}
        colors={["emerald", "rose"]}
        valueFormatter={(number: number) => `€${new Intl.NumberFormat('fr-FR').format(number)}`}
        showLegend={true}
        showGridLines={false}
        curveType="monotone"
      />
    </Card>
  );
}
