"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scissors, UserRound, Shirt, Sparkles } from "lucide-react";
import Input from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

function AuthContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, login, register } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      const dashboardPath =
        user.role === "admin"
          ? "/dashboard/admin"
          : user.role === "couturier"
            ? "/dashboard/couturier"
            : "/dashboard/client";
      window.location.replace(dashboardPath);
    }
  }, [authLoading, user]);

  const [mode, setMode] = useState<"connexion" | "inscription">(() => {
    const m = searchParams?.get("mode");
    return m === "inscription" || m === "connexion" ? m : "connexion";
  });
  const [role, setRole] = useState<"client" | "couturier" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!role) {
      setError("Veuillez d'abord choisir votre role (Client ou Couturier)");
      return;
    }

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
        setError("Le mot de passe doit contenir au moins 6 caracteres");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === "connexion") {
        await login(email, password, role);
      } else {
        await register(name, email, password, role);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Une erreur est survenue. Veuillez reessayer.");
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
    <div className="flex-1 px-4 py-10 bg-[#FFF8EF]">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[#E6D3B8] bg-white shadow-[0_18px_45px_rgba(45,38,28,0.08)] lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden bg-[#27634A] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,248,239,0.14),transparent_45%),radial-gradient(circle_at_20%_20%,rgba(196,107,77,0.35),transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <Scissors size={26} />
            </div>
            <h1 className="mt-8 text-4xl font-bold leading-tight">
              Entrez dans votre espace TailleurConnect.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/85">
              Connectez-vous pour discuter avec un atelier, suivre une commande ou gerer vos realisations.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <Sparkles size={20} className="mb-3 text-[#F7D1A6]" />
              <p className="text-sm font-semibold">Commandes claires</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <Shirt size={20} className="mb-3 text-[#F7D1A6]" />
              <p className="text-sm font-semibold">Ateliers visibles</p>
            </div>
          </div>
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          <Link
            href="/"
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#E6D3B8] bg-[#FFF8EF] px-4 py-2 text-sm font-semibold text-[#27634A] hover:bg-[#F7E7D7] transition-colors"
            aria-label="Retour a la page d'accueil"
          >
            <ArrowLeft size={16} />
            Accueil
          </Link>

          <div className="mb-8">
            <p className="text-sm font-semibold text-[#C46B4D]">
              {mode === "connexion" ? "Bon retour" : "Bienvenue"}
            </p>
            <h2 className="mt-1 text-3xl font-bold text-[#27634A]">
              {mode === "connexion" ? "Connexion" : "Creer un compte"}
            </h2>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-2xl bg-[#FFF8EF] p-1 border border-[#E6D3B8]">
            <button
              onClick={() => { setMode("connexion"); setError(""); }}
              className={`rounded-xl py-3 text-sm font-semibold transition-all ${
                mode === "connexion"
                  ? "bg-[#27634A] text-white shadow-sm"
                  : "text-[#5D6B60] hover:text-[#27634A]"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode("inscription"); setError(""); }}
              className={`rounded-xl py-3 text-sm font-semibold transition-all ${
                mode === "inscription"
                  ? "bg-[#27634A] text-white shadow-sm"
                  : "text-[#5D6B60] hover:text-[#27634A]"
              }`}
            >
              Inscription
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-7">
            <p className="mb-3 text-sm font-semibold text-[#2F3D35]">
              Je continue en tant que
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["client", "couturier"] as const).map((r) => {
                const Icon = r === "client" ? UserRound : Scissors;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      role === r
                        ? "border-[#27634A] bg-[#EAF4EE] text-[#27634A]"
                        : "border-[#E6D3B8] bg-white text-[#5D6B60] hover:bg-[#FFF8EF]"
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7E7D7] text-[#C46B4D]">
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{r === "client" ? "Client" : "Couturier"}</span>
                      <span className="block text-xs opacity-75">
                        {r === "client" ? "Commander et suivre" : "Gerer mon atelier"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {role && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
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

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="mt-4 w-full rounded-xl bg-[#C46B4D] py-3 text-sm font-semibold text-white transition-all hover:bg-[#B85F42] disabled:bg-[#B88977] disabled:cursor-not-allowed"
              >
                {isLoading ? "Chargement..." : mode === "connexion" ? "Se connecter" : "S'inscrire"}
              </button>
            </div>
          )}

          <p className="mt-5 text-center text-sm text-[#718096]">
            {mode === "connexion" ? (
              <>
                Pas encore de compte ?{" "}
                <button
                  onClick={() => { setMode("inscription"); setError(""); }}
                  className="font-semibold text-[#27634A]"
                >
                  Inscrivez-vous
                </button>
              </>
            ) : (
              <>
                Deja un compte ?{" "}
                <button
                  onClick={() => { setMode("connexion"); setError(""); }}
                  className="font-semibold text-[#27634A]"
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
