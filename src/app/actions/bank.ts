'use server';

import { redirect } from 'next/navigation';

import { startAuthorization, getAvailableBanks, createSession, getAccountTransactions, getAccountBalances } from '@/lib/enableBanking';

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

    // 2. Récupérer tous les comptes bancaires liés à cet utilisateur, avec leur token d'accès
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('*, bank_connections!inner(user_id, access_token)')
      .eq('bank_connections.user_id', user.id);

    if (accError) throw new Error(`Erreur récupération comptes: ${accError.message}`);
    if (!accounts || accounts.length === 0) {
      console.log("Aucun compte lié trouvé en base de données.");
      return { success: true, count: 0, message: "Aucun compte lié trouvé." };
    }

    console.log(`${accounts.length} comptes trouvés pour synchronisation.`);

    let totalImported = 0;
    const rangeInDays = 729; // Récupérer 2 ans d'historique si possible
    const historyDate = new Date();
    historyDate.setDate(historyDate.getDate() - rangeInDays);
    const dateFrom = historyDate.toISOString().split('T')[0];
    
    console.log(`Début de la synchronisation pour l'utilisateur ${user.id} depuis le ${dateFrom}`);

    let debugMessages: string[] = [];

    // 3. Pour chaque compte, synchroniser les transactions
    for (const acc of accounts) {
      try {
        const userAccessToken = (acc.bank_connections as any)?.access_token;
        console.log(`Synchronisation du compte ${acc.name} (${acc.bank_uid})...`);
        
        // --- 1. Fetch Balances ---
        try {
          const balances = await getAccountBalances(acc.bank_uid, userAccessToken);
          if (balances && balances.length > 0) {
            const amount = balances[0].balanceAmount?.amount || balances[0].balance_amount?.amount;
            if (amount !== undefined) {
              await supabase.from('bank_accounts').update({ balance: parseFloat(amount) }).eq('id', acc.id);
            }
          }
        } catch (balErr) {
          console.error(`Erreur fetch balances pour ${acc.bank_uid}:`, balErr);
        }

        // --- 2. Fetch Transactions ---
        const rawTransactions = await getAccountTransactions(acc.bank_uid, dateFrom, userAccessToken);
        
        console.log(`${rawTransactions.length} transactions récupérées de la banque.`);
        debugMessages.push(`${acc.name} : ${rawTransactions.length} tx reçues API`);

        if (rawTransactions.length > 0) {
          // Log d'une transaction échantillon pour voir la structure réelle en cas de libellé manquant
          console.log("SAMPLE TRANSACTION STRUCTURE:", JSON.stringify(rawTransactions[0]));

          const transactionsToInsert = rawTransactions.map((tx: any) => {
            // 1. Extraction du montant et gestion du signe (Débit/Crédit)
            const rawAmt = tx.transaction_amount?.amount || tx.transactionAmount?.amount || tx.amount?.value || tx.amount || 0;
            let amountNum = parseFloat(rawAmt);
            
            const indicator = tx.credit_debit_indicator || tx.creditDebitIndicator || tx.transaction_amount?.credit_debit_indicator || tx.transactionAmount?.creditDebitIndicator || tx.amount?.credit_debit_indicator;
            if (indicator === 'DBIT' && amountNum > 0) {
              amountNum = -amountNum;
            } else if (indicator === 'CRDT' && amountNum < 0) {
              amountNum = Math.abs(amountNum);
            }

            // 2. Extraction robuste du libellé
            const getLabel = (t: any) => {
              const getValue = (val: any): string | null => {
                if (!val) return null;
                if (typeof val === 'string') return val.trim();
                if (Array.isArray(val) && val.length > 0) {
                  return val.map(v => typeof v === 'object' ? (v.name || v.value || v.unstructured || JSON.stringify(v)) : v).join(' ').trim();
                }
                if (typeof val === 'object') return val.name || val.value || val.unstructured || JSON.stringify(val);
                return null;
              };

              const fields = [
                t.remittance_information,
                t.remittanceInformation,
                t.remittance_information_unstructured,
                t.remittanceInformationUnstructured,
                t.creditor_name,
                t.creditorName,
                t.merchant_name,
                t.merchantName,
                t.debtor_name,
                t.debtorName,
                t.additional_transaction_information,
                t.additionalTransactionInformation,
                t.description,
                t.reference,
                t.note
              ];
              
              for (const f of fields) {
                const v = getValue(f);
                if (v && v.length > 0 && v !== 'null' && v !== '{}') return v;
              }

              // Fallback sur le code MCC ou le type
              const mcc = t.merchant_category_code || t.merchantCategoryCode;
              if (mcc) return `Catégorie MCC: ${mcc}`;

              return t.proprietary_bank_transaction_code || t.bank_transaction_code || t.proprietaryBankTransactionCode || t.bankTransactionCode || 'Transaction sans libellé';
            };

            const labelVal = getLabel(tx);
            if (!tx.booking_date && !tx.bookingDate && !tx.transaction_date && !tx.transactionDate) {
              console.log("DATELESS TRANSACTION DETECTED:", JSON.stringify(tx));
            }

            const dateVal = tx.booking_date || tx.bookingDate || 
                           tx.value_date || tx.valueDate || 
                           tx.transaction_date || tx.transactionDate || 
                           tx.requested_execution_date || tx.requestedExecutionDate ||
                           tx.expected_booking_date || tx.expectedBookingDate ||
                           tx.expected_value_date || tx.expectedValueDate ||
                           new Date().toISOString().split('T')[0];

            const idVal = tx.transaction_id || tx.transactionId || tx.id || tx.entry_reference || tx.entryReference || `${acc.id}-${dateVal}-${amountNum}-${labelVal.substring(0, 20)}`;

            // 3. Détection des transactions futures/en attente (is_advance)
            const status = tx.status || tx.transaction_status || tx.transactionStatus || tx.entry_status || tx.entryStatus || 'BOOK';
            
            const hasNoDates = !tx.booking_date && !tx.bookingDate && !tx.value_date && !tx.valueDate && !tx.transaction_date && !tx.transactionDate;
            const isAdvance = (status === 'PDNG' || status === 'PEND' || status === 'Pending' || status === 'OTHR') || 
                             hasNoDates || 
                             (new Date(dateVal) > new Date());

            return {
              user_id: user.id,
              amount: amountNum,
              label: labelVal,
              date_real: dateVal,
              bank_id: idVal,
              accounting_period: dateVal.substring(0, 7),
              is_advance: isAdvance,
              raw_data: tx,
              mcc: tx.merchant_category_code || tx.merchantCategoryCode || null,
              balance_after: tx.balance_after_transaction?.balanceAmount?.amount || tx.balanceAfterTransaction?.balanceAmount?.amount || null,
              updated_at: new Date().toISOString()
            };
          });

          const { error: txError } = await supabase
            .from('transactions')
            .upsert(transactionsToInsert, { onConflict: 'bank_id' });

          if (txError) {
            console.error(`Erreur insertion transactions pour compte ${acc.id}:`, txError);
            debugMessages.push(`Erreur DB: ${txError.message}`);
          } else {
            totalImported += transactionsToInsert.length;
            console.log(`${transactionsToInsert.length} transactions insérées/mises à jour en base.`);
          }
        }
      } catch (err: any) {
        console.error(`Erreur critique sync compte ${acc.id}:`, err);
        debugMessages.push(`Erreur API ${acc.name}: ${err.message}`);
      }
    }

    return { 
      success: true, 
      count: totalImported, 
      message: `${totalImported} transactions synchronisées. ${debugMessages.join(' | ')}`
    };
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
    const accessToken = sessionData.access_token; // Récupération du jeton d'accès
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
        access_token: accessToken, // Sauvegarde du jeton d'accès
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
