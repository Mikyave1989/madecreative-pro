import { apiClient } from './client';
import { credits, type CreditInfo } from '~/lib/stores/auth';

const PLAN_CREDITS: Record<string, number> = {
  STARTER: 200,
  GROWTH: 500,
  PRO: 1000,
};

export async function fetchCredits(): Promise<CreditInfo | null> {
  try {
    const userRaw = localStorage.getItem('mc_user');
    if (!userRaw) return null;

    const user = JSON.parse(userRaw);
    const plan = user.plan || 'STARTER';
    const planCredits = PLAN_CREDITS[plan] || 200;

    // Fetch current credit usage from API
    const res = await apiClient<{
      creditsUsed: number;
      creditsPurchased: number;
    }>('/portal/billing');

    if (res.success && res.data) {
      const info: CreditInfo = {
        used: res.data.creditsUsed || 0,
        purchased: res.data.creditsPurchased || 0,
        total: planCredits + (res.data.creditsPurchased || 0),
        remaining: planCredits + (res.data.creditsPurchased || 0) - (res.data.creditsUsed || 0),
      };

      credits.set(info);
      return info;
    }
  } catch {
    // silently fail
  }

  return null;
}

export function hasCredits(): boolean {
  const c = credits.get();
  if (!c) return true; // if we can't check, allow (fail open)
  return c.remaining > 0;
}

export async function deductCredit(amount: number = 1) {
  try {
    // The API handles credit deduction on its side
    // We just update our local store optimistically
    const current = credits.get();

    if (current) {
      credits.set({
        ...current,
        used: current.used + amount,
        remaining: current.remaining - amount,
      });
    }
  } catch {
    // silently fail
  }
}
