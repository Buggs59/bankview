'use client';

import { Card, Title, Text, Button, Flex, Badge, Divider, TextInput } from '@tremor/react';
import { CreditCard, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Search } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { connectBankAction, searchBanksAction } from '@/app/actions/bank';

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);

  // Recherche des banques en temps réel (Debounce de 400ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchBanksAction(searchQuery).then(setAvailableBanks);
      } else {
        setAvailableBanks([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleConnect = (bankId: string) => {
    startTransition(async () => {
      try {
        const response = await connectBankAction(bankId);
        if (response?.error) {
          alert(`Erreur: ${response.error}`);
        } else if (response?.url) {
          window.location.assign(response.url);
        }
      } catch (error: any) {
        alert(`Erreur technique: ${error.message}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Title className="text-3xl font-bold text-white">Paramètres</Title>
        <Text className="text-slate-400">Gérez vos connexions bancaires et vos préférences.</Text>
      </div>

      <div className="grid gap-8">
        <Card className="bg-slate-900 border-slate-800 ring-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <Title className="text-white font-bold text-2xl">Ajouter une banque</Title>
              <Text className="text-slate-400 mt-1">Recherchez votre banque (ex: Crédit Mutuel) pour la lier.</Text>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={18} />
              <TextInput
                placeholder="Rechercher une banque..."
                className="pl-10 bg-slate-950 border-slate-800 text-white rounded-xl"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>
          </div>

          {availableBanks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 pb-6 border-b border-slate-800">
              {availableBanks.map((bank) => (
                <button
                  key={bank.name}
                  disabled={isPending}
                  onClick={() => handleConnect(bank.name)}
                  className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-2xl transition-all text-left group disabled:opacity-50"
                >
                  <div className=\"w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors\">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1">
                    <Text className="text-white font-semibold group-hover:text-indigo-200">{bank.name}</Text>
                    <Text className="text-slate-500 text-xs uppercase tracking-tight">{bank.country}</Text>
                  </div>
                  <Plus size={18} className="text-slate-600 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
          )}

          <Title className="text-white mb-6 font-bold text-xl">Mes Connexions Actives</Title>

          <div className="space-y-4">
            {connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-950/50">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-500">
                  <CreditCard size={24} />
                </div>
                <Text className="text-slate-400 font-medium">Aucun compte connecté pour le moment.</Text>
                <Text className="text-slate-500 text-sm mt-1">L'agrégation bancaire vous permet d'automatiser vos relevés.</Text>
              </div>
            ) : (
              connections.map((conn: any) => (
                <div key={conn.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <Text className="text-white font-semibold">{conn.bank_name}</Text>
                      <Text className="text-slate-500 text-xs">Dernière synchro : {conn.last_sync || 'Jamais'}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="emerald" icon={CheckCircle2}>Actif</Badge>
                    <button className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Security & API Section (Private) */}
        <Card className="bg-slate-900 border-slate-800 ring-0">
          <Title className="text-white">Configuration API (Expert)</Title>
          <Text className="text-slate-400 mb-6">Ces réglages sont nécessaires pour la communication avec Enable Banking.</Text>
          
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <Text className="text-amber-200 font-medium">Clés et Secrets</Text>
              <Text className="text-amber-200/60 text-sm">
                Les clés API sont stockées de manière sécurisée dans les variables d'environnement (`.env.local`). 
                Ne partagez jamais votre clé privée.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
