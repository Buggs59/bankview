import { Suspense } from 'react';
import { Card, Title, Text, Button } from '@tremor/react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { finalizeBankConnectionAction } from '@/app/actions/bank';

export const dynamic = 'force-dynamic';

async function CallbackResult({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const code = params.code as string | undefined;
  const state = params.state as string | undefined;
  const errorParam = params.error as string | undefined;

  if (errorParam) {
    return <ErrorCard message={`Erreur banque : ${errorParam}`} />;
  }

  if (!code) {
    return <ErrorCard message="Aucun code de session retourné par la banque." />;
  }

  // On appelle l'action serveur avec le code ET l'état (qui contient le nom de la banque)
  const res = await finalizeBankConnectionAction(code, state);

  if (res.error) {
    return <ErrorCard message={res.error} />;
  }

  return (
    <Card className="bg-slate-900 border-emerald-500/50 ring-0 text-center py-12">
      <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
      <Title className="text-white text-2xl">Connexion réussie !</Title>
      <Text className="text-slate-400 mt-2">Votre compte bancaire est désormais lié avec succès.</Text>
      {res.sessionId && (
        <Text className="text-slate-500 text-sm mt-4 font-mono">
          ID Session : {res.sessionId.substring(0, 8)}...
        </Text>
      )}
      <div className="mt-8">
        <Link href="/settings">
          <Button className="bg-indigo-600 border-none hover:bg-indigo-500 px-8 py-2 text-white rounded-lg transition-all">
            Retour aux paramètres
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="bg-slate-900 border-rose-500/50 ring-0 text-center py-12">
      <XCircle className="text-rose-500 mx-auto mb-4" size={48} />
      <Title className="text-white text-2xl">Erreur de connexion</Title>
      <Text className="text-slate-400 mt-2">Nous n'avons pas pu valider votre lien bancaire.</Text>
      <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
        <Text className="text-rose-400 text-sm font-mono break-all">{message}</Text>
      </div>
      <div className="mt-8">
        <Link href="/settings">
          <Button className="bg-slate-800 border-none hover:bg-slate-700 px-8 py-2 text-white rounded-lg transition-all">
            Réessayer depuis les paramètres
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function AuthCallbackPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={48} />
            <Text className="text-slate-400">Finalisation de la connexion en cours...</Text>
          </div>
        }>
          <CallbackResult searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
