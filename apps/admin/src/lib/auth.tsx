"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, logout as apiLogout, type AdminUser } from "./api";

// ─── Types ─────────────────────────────────────────────────────

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ───────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("mc_admin_user");
    const token = localStorage.getItem("mc_access_token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored) as AdminUser);
      } catch {
        localStorage.removeItem("mc_admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      const adminUser: AdminUser = { id: data.user.id, email: data.user.email, name: data.user.email, role: data.user.role };
      setUser(adminUser);
      localStorage.setItem("mc_admin_user", JSON.stringify(adminUser));
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    localStorage.removeItem("mc_admin_user");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
