"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConversationPage() {
  const router = useRouter(); // ✅ hook correct
  const [messages, setMessages] = useState([]);

  // Exemple de redirection
  const goBack = () => {
    router.push("/couturier/chat"); // ✅ ici push() est correct
  };

  useEffect(() => {
    // fetch messages par conversationId
  }, []);

  return (
    <div>
      <button onClick={goBack}>Retour</button>
      {/* affichage messages */}
    </div>
  );
}