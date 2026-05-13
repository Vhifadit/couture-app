"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname() ?? '';
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Si connecté, le logo ne renvoie à rien - il reste figé
  const isAuthPage = pathname.startsWith("/auth");

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    // La redirection est gérée par logout dans AuthContext
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header
        className="bg-white/95 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#E6D3B8] backdrop-blur"
      >
        <Link 
          href={user ? `/dashboard/${user.role}` : "/"} 
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Image src="/logo.svg" alt="TailleurConnect" width={36} height={36} />
          <span className="text-lg font-bold text-[#2D6A4F] hidden sm:block">
            TailleurConnect
          </span>
        </Link>
        
        {isAuthPage ? (
          // Page auth - pas de navigation
          null
        ) : user ? (
          // Utilisateur connecté - afficher son nom et bouton déconnexion
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Bonjour, <span className="font-medium text-[#2D6A4F]">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Deconnexion
            </button>
          </div>
        ) : (
          // Non connecté - afficher boutons connexion/inscription
          <nav className="flex items-center gap-4">
            <Link href="/auth?mode=connexion" className="text-sm font-medium text-[#4A5568] hover:text-[#2D6A4F]">
              Connexion
            </Link>
            <Link
              href="/auth?mode=inscription"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#C46B4D] hover:bg-[#B85F42]"
            >
              S&apos;inscrire
            </Link>
          </nav>
        )}
      </header>

      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deconnexion
            </h3>
            <p className="text-gray-600 mb-6">
              Etes-vous sur de vouloir vous deconnecter ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Non
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
