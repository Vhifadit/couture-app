// services/commandes.service.ts
import api from "./api";

const commandesService = {
  getMine: async () => api.get("/commandes/mine").then(res => res.data),
  updateStatus: async (id: string, status: string) =>
    api.patch(`/commandes/${id}/status`, { status }),
};

export default commandesService;