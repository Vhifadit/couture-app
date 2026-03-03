"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/theme";
import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";

export default function providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}