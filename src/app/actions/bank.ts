'use server';

import { redirect } from 'next/navigation';
import { startAuthorization, getAvailableBanks, createSession } from '@/lib/enableBanking';
import { createClient } from '@/utils/supabase/server';

export async function connectBankAction(siteUrl?: string) {
  // === DEBUG ASPSP ===
  try {
    const banks = await getAvailableBanks();
    console.log("=== API ENABLE BANKING : BANQUES EN FRANCE ===");
    console.log(banks.filter((b: any) => b.country === 'FR').map((b: any) => b.name));
  } catch (e) {
    console.error("Erreur lister banques", e);
  }
  // ===================

  const bankConnectorId = 'BBVA'; 
  
  // Sur Vercel, on force le HTTPS
  let baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  if (process.env.VERCEL_URL && !baseUrl.startsWith('https')) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  
  const redirectUrl = `${baseUrl}/auth/callback`;

  try {
    // A NOTER : Pour tester le flux de A à Z avec la Sandbox BBVA,
    // il faut utiliser les credentials de test fournis par le portail Enable Banking.
    const session = await startAuthorization(bankConnectorId, redirectUrl, 'FR');
    if (session.url) {
      return { url: session.url };
    } else {
      throw new Error('Pas d\'URL de redirection reçue de l\'API');
    }
  } catch (error: any) {
    console.error('ERREUR AUTH BANQUE:', error);
    throw new Error(`Détail technique : ${error.message || 'Erreur inconnue'}`);
  }
}

export async function finalizeBankConnectionAction(code: string) {
  try {
    const sessionData = await createSession(code);
    const sessionId = sessionData.session_id;
    const accounts = sessionData.accounts || [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Authentification utilisateur requise.");
    }

    // 1. Enregistrer ou mettre à jour la connexion principale
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .upsert({
        user_id: user.id,
        session_id: sessionId,
        bank_name: 'BBVA', // On pourrait extraire dynamiquement si dispo
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (connError) throw new Error(`Erreur connexion: ${connError.message}`);

    // 2. Enregistrer chaque compte retourné
    if (accounts.length > 0) {
      const accountsToInsert = accounts.map((acc: any) => ({
        connection_id: connection.id,
        bank_uid: acc.uid,
        name: acc.name || acc.product || 'Compte Bancaire',
        iban: acc.account_id?.iban || null,
        currency: acc.currency || 'EUR',
        updated_at: new Date().toISOString()
      }));

      const { error: accError } = await supabase
        .from('bank_accounts')
        .upsert(accountsToInsert, { onConflict: 'bank_uid' });

      if (accError) console.error('Erreur lors de l’enregistrement des comptes:', accError);
    }

    return { success: true, sessionId };
  } catch (error) {
    console.error('Erreur lors de l’échange du code:', error);
    throw error;
  }
}
