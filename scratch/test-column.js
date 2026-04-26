
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
        console.error('Missing Supabase credentials');
        return;
    }
    
    const supabase = createClient(url, key);
    
    console.log('Testing category_id column...');
    const { error } = await supabase
        .from('transactions')
        .select('category_id')
        .limit(1);
        
    if (error) {
        if (error.code === '42703') {
            console.log('COLUMN_MISSING: category_id does not exist.');
        } else {
            console.error('Unexpected error:', error);
        }
    } else {
        console.log('COLUMN_EXISTS: category_id exists.');
    }
}

main();
