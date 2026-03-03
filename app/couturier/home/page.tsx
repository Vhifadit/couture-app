"use client";

import { Grid, Card, CardActionArea, CardContent, Typography, Container } from "@mui/material";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Mes Créations", route: "/couturier/creations" },
  { label: "Dashboard", route: "/couturier/dashboard" },
  { label: "Profil", route: "/couturier/profil" },
];

export default function CouturierHomePage() {
  const router = useRouter();

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: "center" }}>
        Espace Couturier
      </Typography>

      <Grid container spacing={4}>
        {navItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.route}>
            <Card>
              <CardActionArea onClick={() => router.push(item.route)}>
                <CardContent>
                  <Typography align="center">{item.label}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}