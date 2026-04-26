'use client';

import { useMemo } from 'react';
import { DonutChart, Card, Title, Text, List, ListItem } from '@tremor/react';

interface FamilyPieChartProps {
  transactions: any[];
}

export default function FamilyPieChart({ transactions }: FamilyPieChartProps) {
  const { chartData, totalExpenses } = useMemo(() => {
    const expenses = transactions.filter(tx => tx.amount < 0 && !tx.link_id && !tx.linked_id && !tx.is_advance);
    
    const totals: Record<string, number> = {};
    let total = 0;

    expenses.forEach(tx => {
      const familyName = tx.category?.families?.name || 'Général';
      totals[familyName] = (totals[familyName] || 0) + Math.abs(tx.amount);
      total += Math.abs(tx.amount);
    });

    const data = Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);

    return { chartData: data, totalExpenses: total };
  }, [transactions]);

  const valueFormatter = (number: number) => `€${new Intl.NumberFormat('fr-FR').format(number)}`;

  return (
    <Card className="bg-card/40 backdrop-blur-md border-white/5 rounded-[48px] p-10 shadow-2xl h-full flex flex-col">
      <div className="mb-8">
        <Title className="text-white text-xl font-bold tracking-tight">Répartition par Famille</Title>
        <Text className="text-[#8e8e93] text-sm opacity-60">Distribution des dépenses</Text>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-10">
        <DonutChart
          className="h-64"
          data={chartData}
          category="value"
          index="name"
          valueFormatter={valueFormatter}
          colors={["violet", "indigo", "rose", "cyan", "amber", "emerald"]}
          showAnimation={true}
        />
        
        <List className="mt-4">
          {chartData.slice(0, 4).map((item) => (
            <ListItem key={item.name} className="py-2 border-white/5">
              <span className="text-[#8e8e93] text-sm font-medium">{item.name}</span>
              <span className="text-white font-bold">{valueFormatter(item.value)}</span>
            </ListItem>
          ))}
        </List>
      </div>
    </Card>
  );
}
