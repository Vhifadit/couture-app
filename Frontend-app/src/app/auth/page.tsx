"use client";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

function AuthContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, login, register } = useAuth();
  
  useEffect(() => {
    if (user && !authLoading) {
      const dashboardPath = user.role === 'couturier' ? '/dashboard/couturier' : '/dashboard/client';
      window.location.href = dashboardPath;
    }
  }, [user, authLoading]);
  
  const [mode, setMode] = useState<"connexion" | "inscription">(() => {
    const m = searchParams.get("mode");
    return m === "inscription" || m === "connexion" ? m : "connexion";
  });
  const [role, setRole] = useState<"client" | "couturier">("client");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    setError("");
    
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    
    if (mode === "inscription") {
      if (!name) {
        setError("Veuillez entrer votre nom");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "connexion") {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D6A4F]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-4xl overflow-hidden border border-[#C9B99A]">
        <div className="grid grid-cols-2">
          <button
            onClick={() => { setMode("connexion"); setError(""); }}
            className={`py-4 text-sm font-semibold transition-all ${
              mode === "connexion"
                ? "bg-[#2D6A4F] text-white"
                : "bg-[#F5EFE6] text-[#4A5568]"
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setMode("inscription"); setError(""); }}
            className={`py-4 text-sm font-semibold transition-all ${
              mode === "inscription"
                ? "bg-[#2D6A4F] text-white"
                : "bg-[#F5EFE6] text-[#4A5568]"
            }`}
          >
            Inscription
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium mb-3 text-[#4A5568]">
              Je suis :
            </p>
            <div className="flex gap-3">
              {(["client", "couturier"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all border ${
                    role === r
                      ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                      : "bg-[#F5EFE6] text-[#4A5568] border-[#C9B99A]"
                  }`}
                >
                  {r === "client" ? "Client" : "Couturier"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {mode === "inscription" && (
              <Input 
                label="Nom complet" 
                placeholder="Jean Dupont" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Input 
              label="Email" 
              type="email" 
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
              label="Mot de passe" 
              type="password" 
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "inscription" && (
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 w-full py-3 rounded-md text-white font-semibold text-sm transition-all bg-[#2D6A4F] disabled:bg-[#1B4332] disabled:cursor-not-allowed"
          >
            {isLoading ? "Chargement..." : mode === "connexion" ? "Se connecter" : "S'inscrire"}
          </button>

          <p className="text-center text-sm mt-4 text-[#718096]">
            {mode === "connexion" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  onClick={() => { setMode("inscription"); setError(""); }}
                  className="font-medium text-[#2D6A4F]"
                >
                  Inscrivez-vous
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button
                  onClick={() => { setMode("connexion"); setError(""); }}
                  className="font-medium text-[#2D6A4F]"
                >
                  Connectez-vous
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D6A4F]"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

