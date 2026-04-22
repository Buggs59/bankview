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

export async function startAuthorization(bankId: string, redirectUrl: string, country: string = 'FR') {
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
      },
      aspsp: {
        name: bankId,
        country: country,
      },
      redirect_url: redirectUrl,
      state: 'some_unique_state',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to start authorization: ${JSON.stringify(error)}`);
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
    const error = await response.json();
    throw new Error(`Failed to create session: ${JSON.stringify(error)}`);
  }

  return response.json();
}
