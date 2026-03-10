"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { chatApi, Conversation, Message } from "@/lib/api";

export default function CouturierMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await chatApi.getConversations();
        setConversations(response.conversations || []);
        if (response.conversations?.length > 0) {
          setSelectedConv(response.conversations[0]);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des conversations:", err);
        setError("Impossible de charger les conversations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConv) return;
      
      setIsLoadingMessages(true);
      try {
        const response = await chatApi.getConversation(selectedConv._id);
        setMessages(response.messages || []);
        
        // Marquer comme lu
        await chatApi.markAsRead(selectedConv._id);
      } catch (err) {
        console.error("Erreur lors du chargement des messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConv]);

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    try {
      await chatApi.sendMessage(selectedConv._id, newMessage, "TEXTE");
      setNewMessage("");
      // Recharger les messages
      const response = await chatApi.getConversation(selectedConv._id);
      setMessages(response.messages || []);
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      setError("Impossible d'envoyer le message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D6A4F]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-em">Messages</h1>
        <p className="text-sm mt-1 text-ardoise-light">Vos échanges avec vos clients</p>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>Vous n&apos;avez pas encore de conversations.</p>
          <p className="text-sm mt-2">Les clients vous contacteront ici.</p>
        </div>
      ) : (
        <div className="card flex chat-container">
          {/* Liste conversations */}
          <div className="chat-sidebar">
            {conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => setSelectedConv(conv)}
                className={`p-4 cursor-pointer border-b-pierre ${selectedConv?._id === conv._id ? "bg-pierre-light" : "bg-white"}`}
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="avatar bg-pierre-dark shrink-0">
                      {conv.clientName?.[0] || "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-em truncate">{conv.clientName}</p>
                      <p className="text-xs text-ardoise-light truncate">
                        {conv.dernier_message?.contenu || "Aucun message"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-ardoise-light">
                      {conv.dernier_message?.date 
                        ? new Date(conv.dernier_message.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : ""}
                    </span>
                    {(conv.non_lus_couturier || 0) > 0 && (
                      <span className="w-2 h-2 rounded-full bg-em block" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zone chat */}
          <div className="flex flex-col flex-1 min-w-0">
            {selectedConv ? (
              <>
                <div className="p-4 border-b-pierre">
                  <p className="font-semibold text-em">{selectedConv.clientName}</p>
                  <p className="text-xs text-ardoise-light">● Client</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-[#2D6A4F]" />
                    </div>
                  ) : (
                    <>
                      {messages.map((m) => (
                        <div key={m._id} className={`flex ${m.expediteur_role === 'couturier' ? "justify-end" : "justify-start"}`}>
                          <div className={m.expediteur_role === 'couturier' ? "chat-bubble-me" : "chat-bubble-other"}>
                            <p>{m.contenu}</p>
                            <p className="chat-time">
                              {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="p-3 border-t-pierre flex gap-2 items-center">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écrire un message..."
                    className="flex-1 px-4 py-2 rounded-lg text-sm text-ardoise outline-none chat-input-border"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="btn-em flex items-center gap-2 px-4 py-2 disabled:opacity-50"
                  >
                    <Send size={15} /> Envoyer
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sélectionnez une conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
