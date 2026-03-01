// components/couturier/ProtectedRoute.tsx
"use client";

import { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children?: ReactNode }) {
  return <div>Vous n'avez pas accès à cette page.</div>;
}