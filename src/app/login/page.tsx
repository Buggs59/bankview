'use client'

import { useState } from 'react'
import { Card, Title, Text, Button, Divider } from '@tremor/react'
import { Wallet, LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { login, signup } from '../auth/actions'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true)
    // The form action will handle the actual server call via the 'action' prop
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Wallet className="text-white w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DBA</h1>
          <Text className="text-slate-400">Denis Budget Architect</Text>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          <div className="space-y-6">
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn size={16} /> Connexion
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus size={16} /> Inscription
              </button>
            </div>

            <form 
              action={mode === 'login' ? login : signup} 
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="denis@exemple.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:ring-0 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:ring-0 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in zoom-in-95 duration-300">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in zoom-in-95 duration-300">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <p>{message}</p>
                </div>
              )}

              <Button
                type="submit"
                loading={isLoading}
                className="w-full h-12 bg-indigo-600 border-none hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-900/20 font-semibold text-base flex items-center justify-center gap-2 group transition-all"
              >
                {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </Button>
            </form>
          </div>
        </Card>

        <Text className="text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Denis Budget Architect. Sécurisé par Supabase.
        </Text>
      </div>
    </div>
  )
}
