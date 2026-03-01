import api from "./api";

export const chatService = {
  getConversations: () => api.get("/chat/conversations").then(res => res.data),
  getConversation: (id: string, page = 1, limit = 50) =>
    api.get(`/chat/conversations/${id}`, { params: { page, limit } }).then(res => res.data),
  sendMessage: (id: string, contenu: string, type: "TEXTE" | "IMAGE" | "SYSTEME" = "TEXTE") =>
    api.post(`/chat/conversations/${id}/messages`, { contenu, type }).then(res => res.data),
  markAsRead: (id: string) => api.post(`/chat/conversations/${id}/read`),
  closeConversation: (id: string) => api.post(`/chat/conversations/${id}/close`),
};