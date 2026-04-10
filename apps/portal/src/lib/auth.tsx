"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type Plan = "STARTER" | "GROWTH" | "PRO";
export type ClientStatus = "ACTIVE" | "CHURNED" | "REFUNDED";

export interface AuthUser {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  plan: Plan;
  status: ClientStatus;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("mc_token");
      const storedUser = localStorage.getItem("mc_user");
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setToken(storedToken);
        setUser(parsed);
      }
    } catch {
      // Corrupt storage — clear it
      localStorage.removeItem("mc_token");
      localStorage.removeItem("mc_refresh");
      localStorage.removeItem("mc_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAuth = useCallback(
    (newToken: string, refreshToken: string, newUser: AuthUser) => {
      localStorage.setItem("mc_token", newToken);
      localStorage.setItem("mc_refresh", refreshToken);
      localStorage.setItem("mc_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("mc_token");
    localStorage.removeItem("mc_refresh");
    localStorage.removeItem("mc_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve essere usato dentro AuthProvider");
  }
  return ctx;
}
