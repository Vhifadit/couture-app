"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, User, Search } from "lucide-react";
import { chatApi, Conversation, Message } from "@/lib/api";

export default function ClientMessagesPage() {
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
        if (response.conversations?.length > 0 && !selectedConv) {
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
  }, [selectedConv]);

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
      await chatApi.sendMessage(selectedConv._id, newMessage);
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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#2D6A4F]" />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#2D6A4F] animate-pulse">Chargement de vos échanges...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 h-[calc(100vh-140px)]">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-[#2D6A4F] tracking-tight">
            Messages
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-8 h-1 bg-[#2D6A4F] rounded-full"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
              Discussions privées avec vos couturiers
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in duration-300 shrink-0">
          <MessageSquare size={16} />
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_30px_70px_rgba(0,0,0,0.03)] p-20 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-500 flex-1 justify-center">
           <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
             <MessageSquare size={48} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">Aucun message</h2>
             <p className="text-sm text-gray-400 font-medium max-w-sm mx-auto mt-2">Vous n&apos;avez pas encore engagé de discussion. Contactez un couturier pour vos projets.</p>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_40px_80px_rgba(0,0,0,0.04)] flex flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Liste conversations Premium */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-50 flex flex-col shrink-0">
            <div className="p-6 border-b border-gray-50">
               <div className="relative group">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D6A4F] transition-colors" />
                 <input 
                   placeholder="Rechercher..." 
                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:bg-white focus:border-[#2D6A4F]/20 transition-all"
                 />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-6 text-left transition-all duration-300 relative group ${
                    selectedConv?._id === conv._id 
                      ? "bg-[#F5EFE6]/50" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg transition-transform duration-500 group-hover:rotate-6 ${
                        selectedConv?._id === conv._id ? "bg-[#2D6A4F] scale-105" : "bg-gray-200"
                      }`}>
                        {(typeof conv.couturier_id === 'object' ? conv.couturier_id?.name : '')?.[0] || "C"}
                      </div>
                      {(conv.non_lus || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                           {conv.non_lus}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">
                          {typeof conv.couturier_id === 'object' ? conv.couturier_id?.name : 'Atelier'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap ml-2">
                          {conv.dernier_message?.date 
                            ? new Date(conv.dernier_message.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            : ""}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate ${
                        (conv.non_lus || 0) > 0 ? "text-[#2D6A4F] font-black" : "text-gray-400 font-medium"
                      }`}>
                        {conv.dernier_message?.contenu || "Démarrez l'échange..."}
                      </p>
                    </div>
                  </div>
                  {selectedConv?._id === conv._id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#2D6A4F] rounded-r-full shadow-[2px_0_10px_rgba(45,106,79,0.3)]"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Zone Chat Premium */}
          <div className="flex flex-col flex-1 min-w-0 bg-[#FAF9F6]/30">
            {selectedConv ? (
              <>
                {/* Header Chat */}
                <div className="px-8 py-6 bg-white border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#2D6A4F]">
                        <User size={20} />
                     </div>
                     <div>
                        <p className="text-sm font-black text-[#2D6A4F] uppercase tracking-tight">
                          {typeof selectedConv.couturier_id === 'object' ? selectedConv.couturier_id?.name : 'Atelier'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">En ligne</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                  {isLoadingMessages ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-[#2D6A4F]" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Synchonisation...</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((m) => {
                        const isMe = m.expediteur_id === selectedConv.client_id;
                        return (
                          <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`px-5 py-4 rounded-[1.5rem] text-[11px] font-bold leading-relaxed shadow-sm ${
                                isMe 
                                  ? "bg-[#2D6A4F] text-white rounded-tr-none shadow-xl shadow-[#2D6A4F]/10" 
                                  : "bg-white text-gray-700 border border-gray-50 rounded-tl-none"
                              }`}>
                                {m.contenu}
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-2 px-1">
                                {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input Area Premium */}
                <div className="p-8 bg-white border-t border-gray-50">
                  <div className="flex gap-4 items-center bg-gray-50 rounded-[2rem] p-2 pl-6 border border-transparent focus-within:border-[#2D6A4F]/20 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-black/5 transition-all duration-500">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Votre message ici..."
                      className="flex-1 bg-transparent border-none text-[11px] font-bold text-gray-700 outline-none placeholder:text-gray-400"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="w-12 h-12 bg-[#2D6A4F] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-[#2D6A4F]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-100 shadow-xl border border-gray-50">
                  <MessageSquare size={32} />
                </div>
                <div>
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sélectionnez un contact</p>
                   <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">Engagez la discussion pour vos projets</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
