"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Button,
  Snackbar,
  Alert
} from "@mui/material";
import couturierService from "@/services/couturier.service";

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [profil, setProfil] = useState<any>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  useEffect(() => {
    async function fetchProfil() {
      const data = await couturierService.getProfile();
      setProfil(data);
      setLoading(false);
    }
    fetchProfil();
  }, []);

  const handleSave = async () => {
    try {
      await couturierService.updateProfile(profil);
      setSnackbar({
        open: true,
        message: "Profil mis à jour",
        severity: "success"
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Erreur mise à jour",
        severity: "error"
      });
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mon Profil
      </Typography>

      <TextField
        label="Nom de la marque"
        fullWidth
        margin="normal"
        value={profil.nom_marque || ""}
        onChange={(e) =>
          setProfil({ ...profil, nom_marque: e.target.value })
        }
      />

      <TextField
        label="Description"
        fullWidth
        multiline
        rows={4}
        margin="normal"
        value={profil.description || ""}
        onChange={(e) =>
          setProfil({ ...profil, description: e.target.value })
        }
      />

      <FormControlLabel
        control={
          <Switch
            checked={profil.disponibilite || false}
            onChange={(e) =>
              setProfil({
                ...profil,
                disponibilite: e.target.checked
              })
            }
          />
        }
        label="Disponible"
      />

      <Box mt={2}>
        <Button variant="contained" onClick={handleSave}>
          Sauvegarder
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}