import { useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { articlesService } from "@/services/articles.service";

interface Article {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function CreationsPage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await articlesService.getAll();
        setArticles(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchArticles();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes Créations</h1>
      <Grid container spacing={4}>
        {articles.map((article) => (
          <Grid key={article._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <div className="bg-white p-4 rounded shadow">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-48 object-cover rounded" 
              />
              <h2 className="font-bold mt-2">{article.title}</h2>
              <p>{article.description}</p>
            </div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}