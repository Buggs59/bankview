'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Title, Text, Button } from '@tremor/react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { useState, useEffect } from 'react';
import { finalizeBankConnectionAction } from '@/app/actions/bank';

function CallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam) {
      setStatus('error');
      return;
    }

    if (!code) {
      setStatus('error');
      console.error('Aucun code retourné par la banque');
      return;
    }

    finalizeBankConnectionAction(code)
      .then((res) => {
        if (res.success) {
          setSessionId(res.sessionId);
          setStatus('success');
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  }, [code, errorParam]);

  if (status === 'loading') {
    return (
      <Card className="bg-slate-900 border-indigo-500/50 ring-0 text-center py-12">
        <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
        <Title className="text-white">Validation en cours...</Title>
        <Text className="text-slate-400 mt-2">Nous sécurisons votre connexion avec la banque.</Text>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="bg-slate-900 border-rose-500/50 ring-0 text-center py-12">
        <XCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <Title className="text-white">Erreur de connexion</Title>
        <Text className="text-slate-400 mt-2">Nous n'avons pas pu valider votre compte bancaire.</Text>
        <Button className="mt-6 bg-slate-800 border-none hover:bg-slate-700" onClick={() => window.location.href = '/settings'}>
          Retour aux paramètres
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-emerald-500/50 ring-0 text-center py-12">
      <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
      <Title className="text-white">Connexion réussie !</Title>
      <Text className="text-slate-400 mt-2">Votre compte BBVA est désormais lié à DBA.</Text>
      {sessionId && <Text className="text-slate-500 text-sm mt-1">Session: {sessionId.substring(0, 8)}...</Text>}
      <Button className="mt-6 bg-indigo-600 border-none hover:bg-indigo-500" onClick={() => window.location.href = '/settings'}>
        Retour aux paramètres
      </Button>
    </Card>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
            <Text className="text-slate-400">Finalisation de la connexion...</Text>
          </div>
        }>
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
