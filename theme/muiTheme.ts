import { createTheme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
      background: {
        default: mode === "dark" ? "#121212" : "#f4f6f8"
      }
    },
    shape: { borderRadius: 12 }
  });