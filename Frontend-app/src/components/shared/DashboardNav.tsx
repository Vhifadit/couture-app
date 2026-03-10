"use client";
import { LogOut, Bell, User } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

type DashboardNavProps = {
  userName: string;
  role?: "client" | "couturier";
};

export default function DashboardNav({ userName }: DashboardNavProps) {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      <nav className="bg-white border-b border-[#C9B99A] px-6 py-3 flex items-center justify-between">
        {/* Logo inactif (non cliquable) quand connecté */}
        <div className="flex items-center gap-2 cursor-default">
          <Image src="/logo.svg" alt="TailleurConnect" width={36} height={36} />
          <span className="text-lg font-bold text-[#2D6A4F]">TailleurConnect</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Bienvenue, <span className="font-semibold text-[#2D6A4F]">{userName}</span>
          </span>
          <Bell size={18} className="text-gray-600 cursor-pointer hover:text-[#2D6A4F]" />
          <User size={18} className="text-gray-600 cursor-pointer hover:text-[#2D6A4F]" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          >
            <LogOut size={16} />
            Deconnexion
          </button>
        </div>
      </nav>

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

