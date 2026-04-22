const fs = require('fs');
const https = require('https');
const jose = require('./node_modules/jose/dist/node/cjs/index.js');

async function getAspsps() {
  const env = fs.readFileSync('.env.local', 'utf8');
  let token = null;
  const appIdMatch = env.match(/ENABLE_BANKING_APP_ID=(.+)/);
  const pkMatch = env.match(/ENABLE_BANKING_PRIVATE_KEY="((?:.|\n)*?)"/);
  const appId = appIdMatch[1].trim();
  const pkStr = pkMatch[1].replace(/\\n/g, '\n').trim();
  
  const privateKey = await jose.importPKCS8(pkStr, 'RS256');
  token = await new jose.SignJWT({
    iss: appId,
    aud: 'api.enablebanking.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
    .setProtectedHeader({ alg: 'RS256', kid: appId })
    .sign(privateKey);

  const req = https.request('https://api.enablebanking.com/aspsps', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  }, res => {
    let raw = '';
    res.on('data', d => raw += d);
    res.on('end', () => {
      const data = JSON.parse(raw);
      if(!data.aspsps) {
        console.log(data);
        return;
      }
      console.log('Total ASPSPs:', data.aspsps.length);
      console.log('French ASPSPs:', data.aspsps.filter(a => a.country === 'FR').map(a => a.name));
      console.log('Sandbox/Mock:', data.aspsps.filter(a => a.name.toLowerCase().includes('mock') || a.name.toLowerCase().includes('sandbox')).map(a => a.name));
    });
  });
  req.end();
}
getAspsps().catch(console.error);
