// app/couturier/layout.tsx
"use client";

import { ReactNode } from "react";
import { Box, Drawer, List, ListItemButton, ListItemText, AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/couturier/ProtectedRoute";

interface CouturierLayoutProps {
  children: ReactNode;
}

export default function CouturierLayout({ children }: CouturierLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user || user.role !== "couturier") return <ProtectedRoute />;

  const sidebarLinks = [
    { label: "Dashboard", path: "/couturier/dashboard" },
    { label: "Commandes", path: "/couturier/commandes" },
    { label: "Créations", path: "/couturier/creations" },
    { label: "Profil", path: "/couturier/profil" },
    { label: "Messagerie", path: "/couturier/chat" },
  ];

  return (
    <Box display="flex" height="100vh">
      <Drawer variant="permanent" anchor="left">
        <Toolbar />
        <Box sx={{ width: 240 }}>
          <List>
            {sidebarLinks.map(link => (
              <ListItemButton key={link.path} onClick={() => router.push(link.path)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box flex={1} display="flex" flexDirection="column">
        <AppBar position="static">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">TailleurConnect - Couturier</Typography>
            <Box>
              <Typography component="span" sx={{ mr: 2 }}>{user.name}</Typography>
              <Button color="inherit" onClick={logout}>Déconnexion</Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" flex={1} p={3} sx={{ overflowY: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}