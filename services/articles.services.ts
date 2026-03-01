const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const articlesService = {
  getAll: async (): Promise<Article[]> => {
    const response = await fetch(`${API_URL}/api/articles`);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des articles");
    }
    return response.json();
  },

  getById: async (id: string): Promise<Article> => {
    const response = await fetch(`${API_URL}/api/articles/${id}`);
    if (!response.ok) {
      throw new Error("Article non trouvé");
    }
    return response.json();
  },

  create: async (article: Omit<Article, "_id">): Promise<Article> => {
    const response = await fetch(`${API_URL}/api/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });
    if (!response.ok) {
      throw new Error("Erreur lors de la création de l'article");
    }
    return response.json();
  },
};

// Interface Article (à importer ou définir ici)
interface Article {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
}