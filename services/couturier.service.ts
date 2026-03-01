// services/couturier.service.ts
import api from "./api";

const couturierService = {
  getProfile: async () => api.get("/couturier/profile").then(res => res.data),
  updateProfile: async (data: any) => api.put("/couturier/profile", data),
};

export default couturierService;