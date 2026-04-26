const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: We might need a service role key if RLS is strict, but let's try with anon first if we can bypass it or if we have it in env.
// Actually, I'll check if there's a SERVICE_ROLE_KEY in .env.local (I didn't see it before).
// If not, I'll try to find it.

async function debug() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get connections
  const { data: connections, error: connError } = await supabase
    .from('bank_connections')
    .select('*');
  
  if (connError) {
    console.error('Error fetching connections:', connError);
    return;
  }
  
  console.log('Connections:', JSON.stringify(connections, null, 2));
  
  for (const conn of connections) {
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('connection_id', conn.id);
    
    console.log(`Accounts for connection ${conn.id}:`, JSON.stringify(accounts, null, 2));
    
    const { data: txStats, error: txError } = await supabase
      .from('transactions')
      .select('date_real')
      .eq('user_id', conn.user_id)
      .order('date_real', { ascending: true });
    
    if (txStats && txStats.length > 0) {
      console.log(`Transactions for user ${conn.user_id}:`);
      console.log(`- Count: ${txStats.length}`);
      console.log(`- Oldest: ${txStats[0].date_real}`);
      console.log(`- Newest: ${txStats[txStats.length - 1].date_real}`);
    } else {
      console.log(`No transactions found for user ${conn.user_id}`);
    }
  }
}

debug();
