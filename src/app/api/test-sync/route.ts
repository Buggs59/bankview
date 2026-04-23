import { NextResponse } from 'next/server';
import { getAccountTransactions } from '@/lib/enableBanking';

export async function GET() {
  try {
    const uid = '72550dc7-4923-489c-8e20-3267bb62106a'; // The active bank_uid
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
    const dateFrom = ninetyDaysAgo.toISOString().split('T')[0];
    
    // We will try without user access_token first (APP Token)
    const transactions = await getAccountTransactions(uid, dateFrom);
    
    return NextResponse.json({ success: true, count: transactions.length, transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
