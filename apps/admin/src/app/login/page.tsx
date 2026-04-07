"use client";

import { useState, type FormEvent } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, Mail, AlertCircle } from "lucide-react";

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid credentials. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-neon-cyan/40 bg-neon-cyan/10">
            <span
              className="font-orbitron text-lg font-black text-neon-cyan"
              style={{ textShadow: "0 0 16px #00f0ff" }}
            >
              MC
            </span>
          </div>
          <h1
            className="font-orbitron text-xl font-bold tracking-[0.2em] text-neon-cyan uppercase"
            style={{ textShadow: "0 0 12px #00f0ff60" }}
          >
            MadeCreative
          </h1>
          <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-widest text-slate-600">
            Admin Panel — Secure Access
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-lg border border-neon-cyan/20 bg-bg-card p-6 shadow-neon-cyan">
          <p className="mb-5 text-center font-mono-tech text-[10px] uppercase tracking-widest text-slate-500">
            Authentication Required
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              type="email"
              label="Email"
              placeholder="admin@madecreative.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              leftIcon={<Mail className="h-3.5 w-3.5" />}
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              leftIcon={<Lock className="h-3.5 w-3.5" />}
            />

            {error && (
              <div className="flex items-center gap-2 rounded border border-neon-red/30 bg-neon-red/10 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-neon-red" />
                <p className="font-mono-tech text-[10px] text-neon-red">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              color="cyan"
              variant="solid"
              size="md"
              loading={loading}
              className="w-full"
            >
              {loading ? "Authenticating..." : "Access System"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono-tech text-[9px] uppercase tracking-widest text-slate-800">
          MadeCreative Admin v1.0 — Restricted Access
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
