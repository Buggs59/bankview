import Link from 'next/link';
import { Title, Text, Button } from '@tremor/react';
import { ArrowRight, ShieldCheck, LineChart, Wallet } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navigation bare-bones */}
      <nav className="w-full p-6 flex justify-between items-center border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Wallet className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">DBA</span>
        </div>
        <Link href="/dashboard">
          <Button variant="secondary" className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800">
            Accéder à l'application <ArrowRight className="ml-2 w-4 h-4 inline" />
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Lueur de fond */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="z-10 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
            <ShieldCheck size={16} /> Open Banking Intégré
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight leading-tight">
            Reprenez le contrôle <br className="hidden md:block" /> de vos finances.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Denis Budget Architect (DBA) synchronise automatiquement vos comptes bancaires et analyse vos transactions pour vous offrir une vision claire de votre patrimoine.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/dashboard">
              <Button size="xl" className="h-14 px-8 text-lg bg-indigo-600 border-none hover:bg-indigo-500 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all">
                Démarrer l'expérience
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="xl" variant="secondary" className="h-14 px-8 text-lg bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800 rounded-2xl backdrop-blur-sm transition-all">
                Connecter ma banque
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer simple */}
      <footer className="p-8 text-center text-slate-600 text-sm border-t border-white/5 z-10 bg-slate-950">
        &copy; {new Date().getFullYear()} Denis Budget Architect. Connecté via Enable Banking.
      </footer>
    </div>
  );
}
