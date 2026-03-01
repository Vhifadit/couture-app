"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { commandesService } from "@/services/commandes.service";

const fetcher = () => commandesService.getMine();

export default function DashboardPage() {
  const { data: commandes = [], isLoading } = useSWR(
    "commandes-dashboard",
    fetcher,
    { refreshInterval: 15000 }
  );

  const revenusMensuels = useMemo(() => {
    const map: Record<string, number> = {};

    commandes
      .filter((c: any) => c.statut === "livré")
      .forEach((c: any) => {
        const date = new Date(c.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

        map[key] = (map[key] || 0) + c.montant;
      });

    return Object.entries(map).map(([month, total]) => ({
      month,
      total
    }));
  }, [commandes]);

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Revenus Mensuels
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenusMensuels}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#1976d2"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}