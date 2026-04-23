'use server';

import { redirect } from 'next/navigation';

import { startAuthorization, getAvailableBanks, createSession, getAccountTransactions } from '@/lib/enableBanking';

export async function syncTransactionsAction() {
  try {
    const supabase = await createClient();
    
    // 1. Récupérer l'utilisateur
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
    }
    if (!user) throw new Error("Utilisateur non connecté");

    // 2. Récupérer tous les comptes bancaires liés à cet utilisateur
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('*, bank_connections!inner(user_id)')
      .eq('bank_connections.user_id', user.id);

    if (accError) throw new Error(`Erreur récupération comptes: ${accError.message}`);
    if (!accounts || accounts.length === 0) return { success: true, count: 0, message: "Aucun compte lié trouvé." };

    let totalImported = 0;
    const dateFrom = "2024-01-01"; // On remonte très loin pour récupérer le maximum

    // 3. Pour chaque compte, synchroniser les transactions
    for (const acc of accounts) {
      try {
        const rawTransactions = await getAccountTransactions(acc.bank_uid, dateFrom);
        
        if (rawTransactions.length > 0) {
          const transactionsToInsert = rawTransactions.map((tx: any) => ({
            user_id: user.id,
            amount: parseFloat(tx.amount.value),
            label: tx.description || tx.reference || 'Transaction sans libellé',
            date_real: tx.booking_date || tx.value_date,
            bank_id: tx.transaction_id || tx.entry_reference, // Identifiant unique pour onConflict
            accounting_period: (tx.booking_date || tx.value_date).substring(0, 7), // Format YYYY-MM
            updated_at: new Date().toISOString()
          }));

          const { error: txError } = await supabase
            .from('transactions')
            .upsert(transactionsToInsert, { onConflict: 'bank_id' });

          if (txError) {
            console.error(`Erreur insertion transactions pour compte ${acc.id}:`, txError);
          } else {
            totalImported += transactionsToInsert.length;
          }
        }
      } catch (err) {
        console.error(`Erreur sync compte ${acc.id}:`, err);
      }
    }

    return { success: true, count: totalImported };
  } catch (error: any) {
    console.error('ERREUR SYNC GLOBALE:', error);
    return { error: error.message || 'Erreur lors de la synchronisation des transactions' };
  }
}

import { createClient } from '@/utils/supabase/server';

export async function searchBanksAction(query: string = '') {
  try {
    const banks = await getAvailableBanks();
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Filtrer par France et par le nom recherché sans accents
    return banks.filter((b: any) => {
      const normalizedName = b.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return b.country === 'FR' && normalizedName.includes(normalizedQuery);
    }).slice(0, 10);
  } catch (e) {
    console.error("Erreur recherche banques", e);
    return [];
  }
}

export async function connectBankAction(bankId: string) {
  const supabase = await createClient();
  
  let { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;
  }
  
  if (!user) {
    console.error("ERREUR SESSION ACTION : Aucun utilisateur trouvé après getUser et getSession");
    return { error: "Utilisateur non identifié." };
  }

  const headersList = await import('next/headers').then(h => h.headers());
  const host = (await headersList).get('host');
  
  // On construit l'URL de base dynamiquement à partir de la requête actuelle
  // pour être sûr de revenir sur le même domaine et ne pas perdre la session.
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  const redirectUrl = `${baseUrl}/auth/callback`;

  try {
    // On passe l'ID de l'utilisateur ET le nom de la banque dans le 'state'
    const stateData = JSON.stringify({ userId: user.id, bankName: bankId });
    const session = await startAuthorization(bankId, redirectUrl, stateData, 'FR');
    if (session.url) {
      return { url: session.url };
    } else {
      return { error: 'Pas d\'URL de redirection reçue de l\'API' };
    }
  } catch (error: any) {
    console.error('ERREUR AUTH BANQUE:', error);
    return { error: `Détail technique : ${error.message || 'Erreur inconnue'}` };
  }
}

export async function finalizeBankConnectionAction(code: string, stateString?: string) {
  try {
    const sessionData = await createSession(code);
    const sessionId = sessionData.session_id;
    const accounts = sessionData.accounts || [];

    const supabase = await createClient();
    
    // On essaie de récupérer l'utilisateur.
    // Si getUser() échoue, on tente getSession() qui est parfois plus réactif sur les cookies
    let { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user || null;
    }

    if (!user) {
      console.error("SESSION PERDUE AU CALLBACK : Aucun utilisateur trouvé");
      return { error: "Authentification utilisateur requise. Essayez de vous reconnecter à l'application." };
    }

    // 1. Extraire le nom de la banque depuis le state si possible
    let bankName = 'Banque';
    try {
      if (stateString) {
        const stateObj = JSON.parse(stateString);
        bankName = stateObj.bankName || 'Banque';
      }
    } catch (e) {
      console.warn("Impossible de parser le state au callback", e);
    }

    // 2. Enregistrer ou mettre à jour la connexion principale
    const { data: connection, error: connError } = await supabase
      .from('bank_connections')
      .upsert({
        user_id: user.id,
        session_id: sessionId,
        bank_name: bankName,
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
  } catch (error: any) {
    console.error('Erreur lors de l’échange du code:', error);
    return { error: error.message || 'Erreur technique lors de la finalisation' };
  }
}

export async function getUserConnectionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('bank_connections')
    .select(`
      *,
      bank_accounts (*)
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error("Erreur récupération connexions:", error);
    return [];
  }

  return data || [];
}

export async function disconnectBankAction(connectionId: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bank_connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getTransactionsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date_real', { ascending: false });

  if (error) {
    console.error("Erreur récupération transactions:", error);
    return [];
  }

  return data || [];
}
