import { atom, computed } from 'nanostores';

export interface McUser {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  plan: string;
  status: string;
  language: string;
}

export interface CreditInfo {
  remaining: number;
  used: number;
  total: number;
  purchased: number;
}

export const authUser = atom<McUser | null>(null);
export const authLoading = atom<boolean>(true);
export const credits = atom<CreditInfo | null>(null);

export const isLoggedIn = computed(authUser, (user) => !!user);
export const userPlan = computed(authUser, (user) => user?.plan || 'STARTER');

export function initAuth() {
  if (typeof window === 'undefined') return;

  const raw = localStorage.getItem('mc_user');
  const token = localStorage.getItem('mc_token');

  if (raw && token) {
    try {
      authUser.set(JSON.parse(raw));
    } catch {
      authUser.set(null);
    }
  }

  authLoading.set(false);
}

export function setAuth(user: McUser) {
  authUser.set(user);
  localStorage.setItem('mc_user', JSON.stringify(user));
}

export function logout() {
  authUser.set(null);
  credits.set(null);
  localStorage.removeItem('mc_token');
  localStorage.removeItem('mc_refresh_token');
  localStorage.removeItem('mc_user');
}
