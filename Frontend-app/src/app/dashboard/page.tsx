"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardIndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      const dashboardPath = user.role === 'couturier' 
        ? '/dashboard/couturier' 
        : '/dashboard/client';
      router.replace(dashboardPath);
    } else if (!isLoading && !user) {
      // Not logged in, redirect to auth
      router.replace('/auth');
    }
  }, [user, isLoading, router]);

  // Show loading while checking
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}

