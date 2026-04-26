'use server';

import { redirect } from 'next/navigation';

import { revalidatePath } from 'next/cache';
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
    
    // 2.5 Nettoyer les transactions "prévues" (is_advance) existantes
    // car elles sont temporaires et peuvent créer des doublons si leur ID change 
    // ou si elles passent au statut BOOKED avec un ID réel.
    await supabase.from('transactions').delete().eq('user_id', user.id).eq('is_advance', true);

    let totalImported = 0;
    const rangeInDays = 3650; // Récupérer jusqu'à 10 ans d'historique si la banque le permet
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
        console.log(`FETCHING transactions for ${acc.bank_uid} with dateFrom: ${dateFrom}`);
        const rawTransactions = await getAccountTransactions(acc.bank_uid, dateFrom, userAccessToken);
        
        console.log(`${rawTransactions.length} transactions récupérées au total (après pagination) de la banque.`);
        debugMessages.push(`${acc.name} : ${rawTransactions.length} tx reçues API`);

        if (rawTransactions.length > 0) {
          console.log("FIRST TX DATE:", rawTransactions[0].booking_date || rawTransactions[0].bookingDate || rawTransactions[0].transaction_date);
          console.log("LAST TX DATE:", rawTransactions[rawTransactions.length - 1].booking_date || rawTransactions[rawTransactions.length - 1].bookingDate || rawTransactions[rawTransactions.length - 1].transaction_date);
          
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
            
            // --- NOUVEAU: NETTOYAGE DU LIBELLÉ ---
            const cleanLabel = (label: string) => {
              if (!label) return { clean: '', type: null };
              let clean = label;
              let type = '';
              let card = '';

              // Extraction carte
              const cardMatch = label.match(/CARTE\s+(\d{4})/i);
              if (cardMatch) {
                card = cardMatch[1];
                clean = clean.replace(cardMatch[0], '');
              }

              // Patterns types
              const patterns = [
                { regex: /^PAIEMENT PSC\s+\d+\s+/i, t: 'CB' },
                { regex: /^PAIEMENT PSC\s+/i, t: 'CB' },
                { regex: /^PAIEMENT CB\s+\d+\s+/i, t: 'CB' },
                { regex: /^VIR\s+(?:RECU|EMIS|SEPA)?\s*/i, t: 'VIREMENT' },
                { regex: /^F\s+(?:FRAIS|COMM)\s+/i, t: 'FRAIS' },
                { regex: /^PRLV\s+/i, t: 'PRÉLÈVEMENT' },
              ];

              for (const p of patterns) {
                if (p.regex.test(clean)) {
                  type = p.t;
                  clean = clean.replace(p.regex, '');
                }
              }

              clean = clean.replace(/\s+/g, ' ').trim();
              // Formatage Propre (Première lettre majuscule)
              clean = clean.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              
              const finalType = card ? `${type || 'CB'} ${card}` : type;
              return { clean: clean || label, type: finalType || null };
            };

            const { clean: cleanName, type: txType } = cleanLabel(labelVal);

            if (!tx.booking_date && !tx.bookingDate && !tx.transaction_date && !tx.transactionDate) {
              console.log("DATELESS TRANSACTION DETECTED:", JSON.stringify(tx));
            }

            // 3. Détection des transactions futures/en attente (is_advance)
            const status = (tx.status || tx.transaction_status || tx.transactionStatus || tx.entry_status || tx.entryStatus || 'BOOK').toUpperCase();
            
            const hasNoDates = !tx.booking_date && !tx.bookingDate && !tx.value_date && !tx.valueDate && !tx.transaction_date && !tx.transactionDate;
            
            // Priorité aux dates d'exécution pour les "prévus"
            const futureDates = tx.requested_execution_date || tx.requestedExecutionDate ||
                               tx.expected_booking_date || tx.expectedBookingDate ||
                               tx.expected_value_date || tx.expectedValueDate;

            const pastDates = tx.booking_date || tx.bookingDate || 
                             tx.value_date || tx.valueDate || 
                             tx.transaction_date || tx.transactionDate;

            const isAdvance = (status === 'PDNG' || status === 'PEND' || status === 'OTHR') || 
                             hasNoDates || 
                             (futureDates && new Date(futureDates) > new Date());

            // Recherche exhaustive de la meilleure date
            const allDateFields = [
              tx.requested_execution_date, tx.requestedExecutionDate,
              tx.expected_booking_date, tx.expectedBookingDate,
              tx.expected_value_date, tx.expectedValueDate,
              tx.booking_date, tx.bookingDate,
              tx.value_date, tx.valueDate,
              tx.transaction_date, tx.transactionDate,
              tx.creation_date_time, tx.creationDateTime,
              tx.status_updated_date_time, tx.statusUpdatedDateTime
            ].filter(d => d && d.length >= 10);

            // Pour les "prévus", on cherche la date la plus lointaine dans le futur
            // Pour les "réels", on cherche la date de booking/transaction
            let dateValFinal = new Date().toISOString().split('T')[0];
            if (allDateFields.length > 0) {
              if (isAdvance) {
                // Trier par date descendante pour prendre la plus lointaine
                const sortedDates = allDateFields.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                dateValFinal = sortedDates[0].substring(0, 10);
              } else {
                // Pour les transactions réelles, on préfère la date de booking si dispo
                dateValFinal = (tx.booking_date || tx.bookingDate || allDateFields[0]).substring(0, 10);
              }
            }

            // STABILISATION DE L'ID pour les "prévus"
            // Si la banque ne donne pas d'ID stable, on en génère un SANS la date du jour
            // pour qu'il soit écrasé (upsert) ou dédupliqué correctement.
            const bankId = tx.transaction_id || tx.transactionId || tx.id || tx.entry_reference || tx.entryReference;
            const idValFinal = bankId || `${acc.id}-ADV-${Math.round(amountNum * 100)}-${labelVal.trim().toUpperCase().substring(0, 30)}`;

            return {
              user_id: user.id,
              amount: amountNum,
              label: labelVal,
              clean_name: cleanName,
              transaction_type: txType,
              date_real: dateValFinal,
              bank_id: idValFinal,
              accounting_period: dateValFinal.substring(0, 7),
              is_advance: isAdvance,
              raw_data: tx,
              mcc: tx.merchant_category_code || tx.merchantCategoryCode || null,
              balance_after: tx.balance_after_transaction?.balanceAmount?.amount || tx.balanceAfterTransaction?.balanceAmount?.amount || null,
              updated_at: new Date().toISOString()
            };
          });

          // Déduplication locale pour les "prévus" (souvent renvoyés plusieurs fois par jour par les banques)
          const seen = new Set();
          const uniqueTransactions = transactionsToInsert.filter((tx: any) => {
            if (tx.is_advance) {
              // Clé de déduplication robuste : libellé nettoyé + montant exact
              const key = `${tx.label.trim().toUpperCase()}-${Math.round(tx.amount * 100)}`;
              if (seen.has(key)) return false;
              seen.add(key);
            }
            return true;
          });

          const { error: txError } = await supabase
            .from('transactions')
            .upsert(uniqueTransactions, { onConflict: 'bank_id' });

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
    .select('*, category:categories(*, families(*))')
    .eq('user_id', user.id)
    .order('date_real', { ascending: false });

  if (error) return [];

  // Apply rules to un-categorized transactions
  const processedTxs = await applyCategoryRules(data || []);

  return processedTxs;
}

async function applyCategoryRules(transactions: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return transactions;

  // 1. Get all rules for this user
  const { data: rules } = await supabase
    .from('category_rules')
    .select('*')
    .eq('user_id', user.id);

  if (!rules || rules.length === 0) return transactions;

  const unCategorized = transactions.filter(tx => !tx.category_id);
  if (unCategorized.length === 0) return transactions;

  const updates = [];
  const updatedTxs = [...transactions];

  for (const tx of unCategorized) {
    const name = (tx.clean_name || tx.label || '').toLowerCase();
    const matchingRule = rules.find(r => name.includes(r.pattern.toLowerCase()));
    
    if (matchingRule) {
      // Find index in main array
      const idx = updatedTxs.findIndex(t => t.id === tx.id);
      if (idx !== -1) {
        updatedTxs[idx] = { ...updatedTxs[idx], category_id: matchingRule.category_id };
        updates.push({ id: tx.id, category_id: matchingRule.category_id });
      }
    }
  }

  // Bulk update in background (don't wait for it to return the results)
  if (updates.length > 0) {
    Promise.all(updates.map(u => 
      supabase.from('transactions').update({ category_id: u.category_id }).eq('id', u.id)
    )).catch(e => console.error("Error bulk applying rules:", e));
  }

  return updatedTxs;
}

export async function updateTransactionCategoryAction(transactionId: string, categoryId: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // 1. Update the target transaction
  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('clean_name, label')
    .eq('id', transactionId)
    .single();

  const { error } = await supabase
    .from('transactions')
    .update({ category_id: categoryId })
    .eq('id', transactionId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };

  // 2. Create/Update a rule if category is set
  if (categoryId && tx) {
    const pattern = tx.clean_name || tx.label;
    if (pattern) {
      await supabase.from('category_rules').upsert({
        user_id: user.id,
        pattern: pattern,
        category_id: categoryId
      }, { onConflict: 'user_id,pattern' });

      // 3. Apply this rule to all other transactions with same name
      await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('user_id', user.id)
        .is('category_id', null)
        .or(`clean_name.ilike.%${pattern}%,label.ilike.%${pattern}%`);
    }
  }

  revalidatePath('/transactions');
  revalidatePath('/categories');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getMatchableTransactionsAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Get the source transaction
  const { data: tx } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (!tx) return [];

  // 2. Find transactions with opposite sign and similar amount (+/- 20%)
  const minAmount = -tx.amount * 1.2;
  const maxAmount = -tx.amount * 0.8;
  
  // Logic: if tx is credit (positive), look for debits (negative)
  // If tx is debit (negative), look for credits (positive)
  const isCredit = tx.amount > 0;

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(name)')
    .eq('user_id', user.id)
    .order('date_real', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Erreur recherche correspondances:", error);
    return [];
  }

  return data || [];
}

export async function linkTransactionsAction(id1: string, id2: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté' };

  // Update both transactions to point to each other
  const { error: err1 } = await supabase
    .from('transactions')
    .update({ linked_id: id2 })
    .eq('id', id1)
    .eq('user_id', user.id);

  const { error: err2 } = await supabase
    .from('transactions')
    .update({ linked_id: id1 })
    .eq('id', id2)
    .eq('user_id', user.id);

  if (err1 || err2) {
    return { error: (err1?.message || err2?.message) };
  }

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function unlinkTransactionAction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non connecté' };

  // 1. Find the linked transaction
  const { data: current, error: fError } = await supabase
    .from('transactions')
    .select('linked_id')
    .eq('id', transactionId)
    .single();

  if (fError || !current) return { error: 'Transaction non trouvée' };

  const linkedId = current.linked_id;

  // 2. Clear linked_id on both
  const { error: err1 } = await supabase
    .from('transactions')
    .update({ linked_id: null })
    .eq('id', transactionId);

  if (linkedId) {
    await supabase
      .from('transactions')
      .update({ linked_id: null })
      .eq('id', linkedId);
  }

  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  return { success: true };
}
