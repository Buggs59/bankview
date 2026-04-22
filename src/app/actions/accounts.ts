'use server';

import { createClient } from '@/utils/supabase/server';

export async function getBankAccountsAction() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('bank_accounts')
    .select(`
      *,
      bank_connections!inner(user_id)
    `)
    .eq('bank_connections.user_id', user.id);

  if (error) {
    console.error('Error fetching bank accounts:', error);
    return [];
  }

  return data;
}
