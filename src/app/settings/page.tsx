'use client';

import { Card, Title, Text, Button, Flex, Badge, Divider } from '@tremor/react';
import { CreditCard, Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { connectBankAction } from '@/app/actions/bank';

export default function SettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [connections, setConnections] = useState([
    // On simulera une connexion vide au début
  ]);

  const handleConnect = () => {
    startTransition(async () => {
      try {
        const response = await connectBankAction(window.location.origin);
        if (response?.url) {
          window.location.assign(response.url);
        }
      } catch (error) {
        alert("Erreur lors de l'initialisation de la connexion bancaire. Vérifiez vos clés API.");
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
        {/* Bank Connections Section */}
        <Card className="bg-slate-900 border-slate-800 ring-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title className="text-white">Comptes Bancaires</Title>
              <Text className="text-slate-400">Connectez vos comptes via Enable Banking (Open Banking).</Text>
            </div>
            <Button 
              icon={isPending ? Loader2 : Plus} 
              variant="primary" 
              loading={isPending}
              onClick={handleConnect}
              className="bg-indigo-600 border-none hover:bg-indigo-500 rounded-xl"
            >
              Connecter ma banque
            </Button>
          </div>

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
