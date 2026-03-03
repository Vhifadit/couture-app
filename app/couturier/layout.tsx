//app/couturier/layout.tsx
import { ReactNode } from "react";

export default function CouturierLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* Ici tu peux ajouter un header/nav commun si besoin */}
      {children}
    </div>
  );
}