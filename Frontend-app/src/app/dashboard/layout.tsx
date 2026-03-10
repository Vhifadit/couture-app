'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  User,
  Bell,
  Scissors,
  Menu,
  X,
  Images,
} from 'lucide-react';
import { ToastProvider } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard/client' && href !== '/dashboard/couturier');

  return (
    <Link href={href} onClick={onClick} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out hover:translate-x-1 ${isActive ? 'bg-[#2D6A4F] text-white shadow-md' : 'text-gray-500 hover:bg-[#F5EFE6] hover:text-[#2D6A4F]'}`}>
      {children}
    </Link>
  );
}

function SidebarContent({ isCouturier, onLinkClick, onLogout }: { isCouturier: boolean; onLinkClick?: () => void; onLogout: () => void }) {
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-15 lg:px-6">
        <div className="flex items-center gap-2 font-serif text-lg font-bold cursor-default">
          <Image src="/logo.svg" alt="TailleurConnect" width={32} height={32} />
          <span className="text-[#2D6A4F]">TailleurConnect</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
          <NavLink href={isCouturier ? '/dashboard/couturier' : '/dashboard/client'} onClick={onLinkClick}>
            <LayoutDashboard className="h-4 w-4" />
            Tableau de bord
          </NavLink>
          {!isCouturier && (
            <NavLink href="/couturiers" onClick={onLinkClick}>
              <Scissors className="h-4 w-4" />
              Couturiers
            </NavLink>
          )}
          {isCouturier && (
            <NavLink href="/dashboard/couturier/realisations" onClick={onLinkClick}>
              <Images className="h-4 w-4" />
              Realisations
            </NavLink>
          )}
          <NavLink href={isCouturier ? '/dashboard/couturier/commandes' : '/dashboard/client/commandes'} onClick={onLinkClick}>
            <Package className="h-4 w-4" />
            Commandes
          </NavLink>
          <NavLink href={isCouturier ? '/dashboard/couturier/messages' : '/dashboard/client/messages'} onClick={onLinkClick}>
            <MessageSquare className="h-4 w-4" />
            Messages
          </NavLink>
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <NavLink href={isCouturier ? '/dashboard/couturier/settings' : '/dashboard/client/settings'} onClick={onLinkClick}>
          <Settings className="h-4 w-4" />
          Paramètres
        </NavLink>
        <button
          onClick={() => {
            if (onLinkClick) onLinkClick();
            onLogout();
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out hover:translate-x-1 text-gray-500 hover:bg-[#F5EFE6] hover:text-[#2D6A4F] w-full text-left"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // === TOUS LES HOOKS ICI - ORDRE INVARIANT ===
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout: authLogout, isLoading } = useAuth();
  
  // Valeur derivée - APRES tous les hooks
  const isCouturier = pathname.startsWith('/dashboard/couturier');

  // Route protection - redirect if not logged in using window.location for immediate redirect
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/auth';
    }
  }, [user, isLoading]);

  // Also handle the case where user is null to prevent empty page
  if (!isLoading && !user) {
    return null;
  }

  // Handlers
  const openLogoutConfirm = () => setShowLogoutConfirm(true);
  const closeLogoutConfirm = () => setShowLogoutConfirm(false);
  const handleLogout = () => openLogoutConfirm();
  const confirmLogout = () => {
    console.log("Déconnexion de l'utilisateur...");
    authLogout();
    closeLogoutConfirm();
  };
  const handleMobileLinkClick = () => setIsMobileMenuOpen(false);

  // Early returns - APRES tous les hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentUser = { name: user.name, imageUrl: user.imageUrl || null };

  return (
    <ToastProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-white md:block">
          <SidebarContent isCouturier={isCouturier} onLogout={handleLogout} />
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
              <div className="absolute top-3 right-3 z-50">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Fermer le menu">
                  <X size={24} />
                </button>
              </div>
              <SidebarContent isCouturier={isCouturier} onLinkClick={handleMobileLinkClick} onLogout={handleLogout} />
            </div>
          </div>
        )}

        <div className="flex flex-col bg-[#FAF9F6]">
          <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-15 lg:px-6 sticky top-0 z-30">
            <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md" onClick={() => setIsMobileMenuOpen(true)} aria-label="Ouvrir le menu">
              <Menu size={24} />
            </button>

            <div className="w-full flex-1 md:hidden">
              <div className="flex items-center gap-2 font-serif text-lg font-bold cursor-default">
                <Image src="/logo.svg" alt="TailleurConnect" width={28} height={28} />
                <span className="text-[#2D6A4F]">TailleurConnect</span>
              </div>
            </div>
            <div className="w-full flex-1 hidden md:block"></div>
            <Link href={isCouturier ? '/dashboard/couturier/messages' : '/dashboard/client/messages'} aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-[#2D6A4F]" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center focus:outline-none"
                aria-label="Menu utilisateur"
                aria-expanded={isProfileMenuOpen}
              >
                {currentUser.imageUrl ? (
                  <Image src={currentUser.imageUrl} alt="Photo de profil" width={32} height={32} className="h-8 w-8 rounded-full object-cover border border-[#C9B99A]" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#F5EFE6] flex items-center justify-center text-[#2D6A4F] border border-[#C9B99A] cursor-pointer font-semibold">
                    {currentUser.name ? currentUser.name[0] : <User size={18} />}
                  </div>
                )}
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-[#C9B99A] z-50">
                  <Link href={isCouturier ? '/dashboard/couturier/settings' : '/dashboard/client/settings'} className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F5EFE6] hover:text-[#2D6A4F]" onClick={() => setIsProfileMenuOpen(false)}>
                    Paramètres
                  </Link>
                  <button onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
        </div>

        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Déconnexion</h3>
              <p className="text-gray-600 mb-6">Etes-vous sûr de vouloir vous déconnecter ?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={closeLogoutConfirm} className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                  Non
                </button>
                <button onClick={confirmLogout} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                  Oui
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

