const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    
    if (!urlMatch || !keyMatch) {
        console.error('Missing Supabase credentials in .env.local');
        return;
    }
    
    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();
    
    const supabase = createClient(url, key);
    
    console.log('--- Bank Connections ---');
    const { data: connections, error: connError } = await supabase.from('bank_connections').select('*');
    if (connError) console.error(connError);
    else console.log(JSON.stringify(connections, null, 2));
    
    console.log('--- Bank Accounts ---');
    const { data: accounts, error: accError } = await supabase.from('bank_accounts').select('*');
    if (accError) console.error(accError);
    else console.log(JSON.stringify(accounts, null, 2));
    
    console.log('--- Transactions Stats ---');
    const { data: txs, error: txError } = await supabase.from('transactions').select('date_real').order('date_real', { ascending: true });
    if (txError) console.error(txError);
    else {
        console.log(`Total Transactions: ${txs.length}`);
        if (txs.length > 0) {
            console.log(`Oldest: ${txs[0].date_real}`);
            console.log(`Newest: ${txs[txs.length - 1].date_real}`);
        }
    }
}

main();
