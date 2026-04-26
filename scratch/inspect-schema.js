
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
    const env = fs.readFileSync('.env.local', 'utf8');
    const lines = env.split(/\r?\n/);
    const config = {};
    for (const line of lines) {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            config[key] = value;
        }
    }
    
    const url = config['NEXT_PUBLIC_SUPABASE_URL'];
    const key = config['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    
    if (!url || !key) {
        console.error('Missing Supabase credentials in .env.local');
        return;
    }
    
    console.log('Using URL:', url);
    const supabase = createClient(url, key);
    
    const { data, error } = await supabase.from('transactions').select('*').limit(1);
    if (error) {
        console.error(error);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data found.');
    }
}

main();
