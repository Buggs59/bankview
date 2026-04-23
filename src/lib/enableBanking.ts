import * as jose from 'jose';

const ENABLE_BANKING_API_URL = 'https://api.enablebanking.com';

export async function getEnableBankingToken() {
  const appId = process.env.ENABLE_BANKING_APP_ID;
  let privateKeyPem = process.env.ENABLE_BANKING_PRIVATE_KEY;

  if (!appId || !privateKeyPem) {
    console.error(`Missing credentials: AppId present: ${!!appId}, PrivateKey present: ${!!privateKeyPem}`);
    throw new Error('Enable Banking credentials missing in environment variables');
  }

  // Nettoyage de la clé pour Vercel (gestion des \n et des guillemets éventuels)
  privateKeyPem = privateKeyPem.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

  // Convert PEM to a format jose can use
  const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');

  // Create JWT
  const jwt = await new jose.SignJWT({
    iss: appId,
    aud: 'api.enablebanking.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
    .setProtectedHeader({ alg: 'RS256', kid: appId })
    .sign(privateKey);

  return jwt;
}

export async function startAuthorization(bankId: string, redirectUrl: string, state: string, country: string = 'FR') {
  const token = await getEnableBankingToken();
  
  const response = await fetch(`${ENABLE_BANKING_API_URL}/auth`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access: {
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        scopes: ['accounts', 'balances', 'transactions'],
      },
      aspsp: {
        name: bankId,
        country: country,
      },
      redirect_url: redirectUrl,
      state: state,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ENABLE BANKING ERROR BODY:', errorText);
    let errorDetail;
    try {
      errorDetail = JSON.parse(errorText);
    } catch {
      errorDetail = errorText;
    }
    throw new Error(`Failed to start authorization: ${JSON.stringify(errorDetail)}`);
  }

  return response.json();
}

export async function getAvailableBanks() {
  const token = await getEnableBankingToken();
  const response = await fetch(`${ENABLE_BANKING_API_URL}/aspsps`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.aspsps || [];
}

export async function createSession(code: string) {
  const token = await getEnableBankingToken();
  const response = await fetch(`${ENABLE_BANKING_API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ENABLE BANKING SESSION ERROR:', errorText);
    throw new Error(`Failed to create session: ${errorText}`);
  }

  return response.json();
}

export async function getAccountTransactions(accountUid: string, dateFrom?: string, accessToken?: string) {
  // On utilise le jeton d'accès utilisateur s'il est fourni, sinon on retombe sur le token APP
  const token = accessToken || await getEnableBankingToken();
  
  let url = `${ENABLE_BANKING_API_URL}/accounts/${accountUid}/transactions`;
  if (dateFrom) {
    url += `?date_from=${dateFrom}`;
  }

  console.log(`Appel Enable Banking Transactions: ${url} (Token type: ${accessToken ? 'USER' : 'APP'})`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ENABLE BANKING TRANSACTIONS ERROR (${accountUid}):`, errorText);
    throw new Error(`Failed to fetch transactions: ${errorText}`);
  }

  const data = await response.json();
  console.log(`Transactions reçues pour ${accountUid}: ${data.transactions?.length || 0}`);
  return data.transactions || [];
}

export async function getAccountBalances(accountUid: string, accessToken?: string) {
  const token = accessToken || await getEnableBankingToken();
  
  const url = `${ENABLE_BANKING_API_URL}/accounts/${accountUid}/balances`;
  console.log(`Appel Enable Banking Balances: ${url} (Token type: ${accessToken ? 'USER' : 'APP'})`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ENABLE BANKING BALANCES ERROR (${accountUid}):`, errorText);
    throw new Error(`Failed to fetch balances: ${errorText}`);
  }

  const data = await response.json();
  return data.balances || [];
}
