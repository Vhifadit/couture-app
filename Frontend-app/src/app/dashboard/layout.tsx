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
  Bell,
  Scissors,
  Menu,
  X,
  Images,
} from 'lucide-react';
import ClientAvatar from '@/components/ClientAvatar';
import { ToastProvider } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { notificationApi, NotificationItem } from '@/lib/api';

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname() ?? '';
  const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard/client' && href !== '/dashboard/couturier');

  return (
    <Link 
      href={href} 
      onClick={onClick} 
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-500 ease-in-out group ${
        isActive 
          ? 'bg-[#2D6A4F] text-white shadow-xl shadow-[#2D6A4F]/20' 
          : 'text-gray-400 hover:bg-[#F5EFE6] hover:text-[#2D6A4F]'
      }`}
    >
      <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
        {children}
      </div>
    </Link>
  );
}

function SidebarContent({ isCouturier, onLinkClick, onLogout }: { isCouturier: boolean; onLinkClick?: () => void; onLogout: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-24 items-center px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#2D6A4F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2D6A4F]/20 group-hover:rotate-12 transition-transform duration-500">
            <Scissors className="text-white h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#2D6A4F] font-black text-xl tracking-tight leading-none">Tailleur</span>
            <span className="text-gray-300 font-black text-[10px] uppercase tracking-[0.2em] leading-none mt-1">Connect</span>
          </div>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4 px-4">
        <nav className="flex flex-col gap-2">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Menu Principal</span>
          </div>
          
          <NavLink href={isCouturier ? '/dashboard/couturier' : '/dashboard/client'} onClick={onLinkClick}>
            <LayoutDashboard size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
          </NavLink>
          
          {!isCouturier && (
            <NavLink href="/couturiers" onClick={onLinkClick}>
              <Scissors size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Couturiers</span>
            </NavLink>
          )}
          
          {isCouturier && (
            <NavLink href="/dashboard/couturier/realisations" onClick={onLinkClick}>
              <Images size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Realisations</span>
            </NavLink>
          )}
          
          <NavLink href={isCouturier ? '/dashboard/couturier/commandes' : '/dashboard/client/commandes'} onClick={onLinkClick}>
            <Package size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Commandes</span>
          </NavLink>
          
          <NavLink href={isCouturier ? '/dashboard/couturier/messages' : '/dashboard/client/messages'} onClick={onLinkClick}>
            <MessageSquare size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Messages</span>
          </NavLink>
        </nav>
      </div>

      <div className="p-4 mt-auto border-t border-gray-50">
        <nav className="flex flex-col gap-2">
          <NavLink href={isCouturier ? '/dashboard/couturier/settings' : '/dashboard/client/settings'} onClick={onLinkClick}>
            <Settings size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Réglages</span>
          </NavLink>
          
          <button
            onClick={() => {
              if (onLinkClick) onLinkClick();
              onLogout();
            }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
            <span className="text-xs font-black uppercase tracking-widest">Déconnexion</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout: authLogout, isLoading } = useAuth();
  
  const isCouturier = pathname.startsWith('/dashboard/couturier');
  const expectedRole = isCouturier ? 'couturier' : 'client';
  const ownDashboard =
    user?.role === 'admin'
      ? '/dashboard/admin'
      : user?.role === 'couturier'
        ? '/dashboard/couturier'
        : '/dashboard/client';

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/auth';
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading && user && user.role !== expectedRole) {
      window.location.replace(ownDashboard);
    }
  }, [expectedRole, isLoading, ownDashboard, user]);

  useEffect(() => {
    if (!user) return;
    notificationApi.getAll(8)
      .then((response) => {
        setNotifications(response.notifications);
        setUnreadNotifications(response.unread);
      })
      .catch(() => undefined);
  }, [user]);

  if (!isLoading && !user) return null;

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    authLogout();
    setShowLogoutConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin shadow-xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2D6A4F] animate-pulse">TailleurConnect</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="soft-dashboard flex min-h-screen w-full bg-[#FFF8EF] selection:bg-[#2D6A4F] selection:text-white">
        {/* Sidebar Desktop */}
        <aside className="hidden md:block w-72 lg:w-80 bg-white border-r border-gray-100 shrink-0 sticky top-0 h-screen">
          <SidebarContent isCouturier={isCouturier} onLogout={handleLogout} />
        </aside>

        {/* Menu Mobile Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl animate-in slide-in-from-left duration-500">
              <SidebarContent isCouturier={isCouturier} onLinkClick={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-6 lg:px-10 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={24} />
              </button>
              
              <div className="hidden md:block">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dashboard / {pathname.split('/').pop()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`p-3 rounded-2xl transition-all duration-300 ${isNotificationOpen ? 'bg-[#F5EFE6] text-[#2D6A4F]' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-4 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-gray-100 bg-white py-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-300">
                    <div className="px-6 pb-4 border-b border-gray-50 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-[#2D6A4F]">Notifications</span>
                      <span className="text-[10px] text-gray-400 font-bold">{unreadNotifications} non lues</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <Bell size={32} className="mx-auto text-gray-100 mb-2" />
                          <p className="text-xs text-gray-400 font-medium">Tout est à jour !</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n._id}
                            onClick={async () => {
                              await notificationApi.markAsRead(n._id).catch(() => undefined);
                              setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, lu: true } : item));
                              setUnreadNotifications(prev => Math.max(0, prev - (n.lu ? 0 : 1)));
                            }}
                            className={`block w-full px-6 py-4 text-left hover:bg-[#F5EFE6] transition-colors border-b border-gray-50 last:border-0 ${n.lu ? 'opacity-60' : ''}`}
                          >
                            <span className="block text-[11px] font-black text-[#2D6A4F] mb-0.5">{n.titre}</span>
                            <span className="block text-[10px] text-gray-500 line-clamp-2">{n.message}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profil */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 p-1 pr-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="border-2 border-white rounded-xl shadow-sm overflow-hidden">
                    <ClientAvatar size={36} />
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-[10px] font-black text-[#2D6A4F] uppercase tracking-wider truncate max-w-[100px]">{user.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</span>
                  </div>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-4 w-56 bg-white rounded-3xl shadow-2xl py-2 border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-300">
                    <Link 
                      href={isCouturier ? '/dashboard/couturier/settings' : '/dashboard/client/settings'} 
                      className="block px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-[#F5EFE6] hover:text-[#2D6A4F] transition-colors" 
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Paramètres
                    </Link>
                    <button 
                      onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} 
                      className="block w-full text-left px-6 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-4 lg:p-10 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </div>

        {/* Modal de Déconnexion */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Déconnexion</h3>
              <p className="text-sm text-gray-500 mb-8 font-medium">Êtes-vous sûr de vouloir quitter votre session ?</p>
              <div className="flex gap-3">
                <button onClick={confirmLogout} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all active:scale-95">
                  Oui, quitter
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

