const jose = require('jose');
const fs = require('fs');

async function run() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  let appId = '';
  let privateKeyPem = '';
  
  for (const line of envContent.split('\n')) {
    if (line.startsWith('ENABLE_BANKING_APP_ID=')) {
      appId = line.split('=')[1].trim().replace(/^"|"$/g, '');
    }
    if (line.startsWith('ENABLE_BANKING_PRIVATE_KEY=')) {
      privateKeyPem = line.substring('ENABLE_BANKING_PRIVATE_KEY='.length).trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    }
  }

  if (!appId || !privateKeyPem) throw new Error('Missing credentials');

  const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256');
  
  const token = await new jose.SignJWT({
    iss: appId,
    aud: 'api.enablebanking.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }).setProtectedHeader({ alg: 'RS256', kid: appId }).sign(privateKey);

  const uid = '72550dc7-4923-489c-8e20-3267bb62106a'; // The active bank_uid
  const dateFrom = '2024-01-01';
  
  console.log('Fetching transactions for uid:', uid);
  const res = await fetch(`https://api.enablebanking.com/accounts/${uid}/transactions?date_from=${dateFrom}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

run().catch(console.error);
