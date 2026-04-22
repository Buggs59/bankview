'use server';

import { redirect } from 'next/navigation';
import { startAuthorization, getAvailableBanks, createSession } from '@/lib/enableBanking';
// L'insertion en bdd nécessitera une implémentation auth côté serveur à l'avenir

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

  // Si tilisy mock ASPSP est cassé, on essaye le sandbox de BBVA qui est dispo aussi
  const bankConnectorId = 'BBVA'; 
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // URL cible du retour après s'être identifié
  const redirectUrl = `${baseUrl}/auth/callback`;

  try {
    // A NOTER : Pour tester le flux de A à Z avec la Sandbox BBVA,
    // il faut utiliser les credentials de test fournis par le portail Enable Banking.
    const session = await startAuthorization(bankConnectorId, redirectUrl, 'FR');
    if (session.url) {
      return { url: session.url };
    } else {
      throw new Error('No redirect URL returned from Enable Banking');
    }
  } catch (error) {
    console.error('Erreur lors de la connexion bancaire:', error);
    throw error;
  }
}

export async function finalizeBankConnectionAction(code: string) {
  try {
    const sessionData = await createSession(code);
    const sessionId = sessionData.session_id;

    // TODO: Enregistrer la sessionData.session_id dans la base de données Supabase
    // Pour l'instant on retourne juste le succès pour ne pas casser votre flux
    console.log("✅ Session Enable Banking récupérée avec succès :", sessionId);

    return { success: true, sessionId };
  } catch (error) {
    console.error('Erreur lors de l’échange du code:', error);
    throw error;
  }
}
