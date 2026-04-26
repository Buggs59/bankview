const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
    const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
    
    if (!urlMatch || !keyMatch) return;
    
    const url = urlMatch[1].trim();
    const key = keyMatch[1].trim();
    
    const supabase = createClient(url, key);
    
    const { data: txs } = await supabase.from('transactions').select('*').order('date_real', { ascending: true }).limit(1);
    
    if (txs && txs.length > 0) {
        console.log('Oldest Transaction:', JSON.stringify(txs[0], null, 2));
    } else {
        console.log('No transactions found');
    }
}

main();
