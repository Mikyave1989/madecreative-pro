"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { verifyCheckoutSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

type Status = "loading" | "success" | "error";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();

  const sessionId = searchParams.get("session_id") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Sessione non trovata. Riprova dalla pagina di registrazione.");
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    async function verify() {
      try {
        const data = await verifyCheckoutSession(sessionId);

        const user: AuthUser = {
          id: data.user.id ?? "",
          email: data.user.email ?? "",
          companyName: data.user.companyName,
          contactName: data.user.contactName ?? data.user.companyName,
          plan: data.user.plan as AuthUser["plan"],
          status: data.user.status as AuthUser["status"],
        };

        setAuth(data.accessToken, data.refreshToken, user);
        setStatus("success");
        toast.success("Account creato con successo!");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Verifica sessione fallita";
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    verify();
  }, [sessionId, setAuth]);

  function handleRetry() {
    verifiedRef.current = false;
    setStatus("loading");
    setErrorMsg("");
    // Re-trigger by updating the ref and re-running
    async function retry() {
      try {
        const data = await verifyCheckoutSession(sessionId);

        const user: AuthUser = {
          id: data.user.id ?? "",
          email: data.user.email ?? "",
          companyName: data.user.companyName,
          contactName: data.user.contactName ?? data.user.companyName,
          plan: data.user.plan as AuthUser["plan"],
          status: data.user.status as AuthUser["status"],
        };

        setAuth(data.accessToken, data.refreshToken, user);
        setStatus("success");
        toast.success("Account creato con successo!");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Verifica sessione fallita";
        setErrorMsg(msg);
        setStatus("error");
      }
    }
    retry();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-10">
          <span className="text-2xl font-bold text-gray-900">
            made<span className="text-indigo-600">creative</span>
          </span>
        </div>

        {/* Loading state */}
        {status === "loading" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Stiamo configurando il tuo account...
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Verifica del pagamento in corso. Non chiudere questa pagina.
              </p>
            </div>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Il tuo account è pronto!
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Pagamento confermato. Puoi iniziare a creare il tuo sito.
              </p>
            </div>
            <Button
              size="lg"
              fullWidth
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              onClick={() => router.push("/dashboard")}
            >
              Vai alla dashboard
            </Button>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Errore di verifica
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {errorMsg || "Non siamo riusciti a verificare il pagamento."}
              </p>
            </div>
            <div className="space-y-3">
              {sessionId && (
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleRetry}
                >
                  Riprova
                </Button>
              )}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => router.push("/login")}
              >
                Torna al login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
