"use client";

import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import { articlesService } from "@/services/articles.service";
import { Article } from "@/types";

export default function CreationsPage() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    articlesService.getAll().then(setArticles).catch(console.error);
  }, []);

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>
        Mes Créations
      </Typography>

      {articles.map((article) => (
        <div key={article._id}>
          <h3>{article.title}</h3>
          <p>{article.description}</p>
        </div>
      ))}
    </Container>
  );
}