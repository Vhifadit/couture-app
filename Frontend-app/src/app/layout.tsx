import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "TailleurConnect",
  description: "Mise en relation clients et couturiers locaux",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-pierre-light min-h-screen font-sans">
        <AuthProvider>
          <ToastProvider>
            <ServiceWorkerRegister />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
