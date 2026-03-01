"use client";

import { useEffect, useState } from "react";
import { Box, Typography, List, ListItemButton, ListItemText, CircularProgress } from "@mui/material";
import { chatService } from "@/services/chat.service";
import { useRouter } from "next/navigation";

export default function ChatListPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mes Conversations</Typography>
      <List>
        {conversations.map(conv => (
          <ListItemButton
            key={conv._id}
            onClick={() => router.push(`/couturier/chat/${conv._id}`)}
          >
            <ListItemText
              primary={conv.sujet || `Conversation #${conv._id}`}
              secondary={`Dernier message: ${conv.dernier_message?.contenu?.slice(0, 50) || "Aucun message"}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}