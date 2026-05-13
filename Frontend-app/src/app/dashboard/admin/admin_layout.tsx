'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Newspaper,
  Scissors,
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/admin',              label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { href: '/dashboard/admin/utilisateurs', label: 'Utilisateurs',    icon: Users },
  { href: '/dashboard/admin/commandes',    label: 'Commandes',       icon: ShoppingBag },
  { href: '/dashboard/admin/articles',     label: 'Articles',        icon: Newspaper },
  { href: '/dashboard/admin/couturiers',   label: 'Couturiers',      icon: Scissors },
];

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-500 ease-in-out group ${
        active 
          ? 'bg-[#2D6A4F] text-white shadow-xl shadow-[#2D6A4F]/20' 
          : 'text-gray-400 hover:bg-[#F5EFE6] hover:text-[#2D6A4F]'
      }`}
    >
      <div className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {children}
      </div>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      const dashboardPath =
        user?.role === 'couturier'
          ? '/dashboard/couturier'
          : user?.role === 'client'
            ? '/dashboard/client'
            : '/auth';
      router.replace(dashboardPath);
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin shadow-xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2D6A4F] animate-pulse">ADMIN PANEL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="soft-dashboard flex min-h-screen w-full bg-[#FFF8EF] selection:bg-[#2D6A4F] selection:text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-72 lg:w-80 bg-white border-r border-gray-100 shrink-0 sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex h-24 items-center px-8 border-b border-gray-50">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#2D6A4F] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2D6A4F]/20 group-hover:rotate-12 transition-transform duration-500">
                <Shield className="text-white h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[#2D6A4F] font-black text-xl tracking-tight leading-none">Admin</span>
                <span className="text-gray-300 font-black text-[10px] uppercase tracking-[0.2em] leading-none mt-1">Connect</span>
              </div>
            </Link>
          </div>
          
          <div className="flex-1 overflow-auto py-8 px-4">
            <nav className="flex flex-col gap-2">
              <div className="px-4 mb-2">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Navigation Système</span>
              </div>
              
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard/admin' && pathname.startsWith(href));
                return (
                  <NavLink key={href} href={href} active={active}>
                    <Icon size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-50">
             <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                 {user.name?.charAt(0)?.toUpperCase()}
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-black text-[#2D6A4F] uppercase tracking-wider truncate">{user.name}</p>
                 <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate">Root Administrator</p>
               </div>
             </div>
             <button
               onClick={logout}
               className="flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
             >
               <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
               <span className="text-xs font-black uppercase tracking-widest">Déconnexion</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex h-20 items-center justify-between gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <div className="hidden md:block">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                 ADMIN / {pathname.split('/').filter(Boolean).slice(-1)[0]}
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2">
              <Shield size={14} className="text-purple-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">Session Sécurisée</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-4 lg:p-10 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
