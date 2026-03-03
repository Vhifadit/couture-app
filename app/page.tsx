import { Container, Typography } from "@mui/material";
import Link from "next/link";

export default function HomePage() {
  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>
        Bienvenue sur TailleurConnect
      </Typography>

      <Link href="/couturier/home">
        Accéder à l'espace Couturier
      </Link>
    </Container>
  );
}