import { useParams, useLocation } from "wouter";
import { useNegotiation, useUpdateNegotiationStatus } from "@/hooks/use-negotiations";
import { useConversation, useSendMessage } from "@/hooks/use-chat";
import { Header } from "@/components/Header";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Chat() {
  const { id } = useParams();
  const negotiationId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  
  const { data: negotiation, isLoading: isLoadingNeg } = useNegotiation(negotiationId);
  const { data: conversation, isLoading: isLoadingConv } = useConversation(negotiation?.conversationId || 0);
  const updateStatus = useUpdateNegotiationStatus();
  const sendMessage = useSendMessage();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (isLoadingNeg || !negotiation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAccept = async () => {
    await updateStatus.mutateAsync({
      id: negotiationId,
      status: "accepted",
      finalPrice: Number(negotiation.product.price) // Simplified, usually parsed from last message
    });
    setLocation("/vendor");
  };

  const handleManualSend = async (text: string) => {
    if (!text.trim()) return;
    await sendMessage.mutateAsync({
      id: negotiation.conversationId,
      content: text
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header title="Negotiation" showBack />

      {/* Product Summary Card */}
      <div className="bg-white border-b border-slate-100 p-4 shadow-sm z-10">
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">{negotiation.product.name}</h3>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">
              Current Ask: ₹{negotiation.finalPrice || negotiation.product.price}
            </p>
          </div>
          <div 
            className="w-12 h-12 rounded-lg bg-cover bg-center shadow-sm"
            style={{ backgroundImage: `url(${negotiation.product.imageUrl})` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {conversation?.messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-end gap-3 max-w-[85%]",
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "size-8 rounded-full flex-shrink-0 bg-cover bg-center border border-slate-200 shadow-sm",
                isUser ? "bg-slate-200" : "bg-primary/10 flex items-center justify-center"
              )} 
                style={isUser ? { backgroundImage: 'url(/images/sarah.jpg)' } : {}}
              >
                {!isUser && <span className="material-symbols-outlined text-primary text-sm">storefront</span>}
              </div>
              
              <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                <span className="text-[10px] text-slate-400 font-medium px-1">
                  {isUser ? "Sarah" : "Vendor (AI)"}
                </span>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  isUser 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}
        {/* Spacer for bottom panel */}
        <div className="h-4" />
      </div>

      {/* Actions Panel */}
      <div className="bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-t-3xl relative z-20">
        <div className="p-4 pb-8 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Accept Offer
            </button>
            <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">edit</span>
              Counter
            </button>
          </div>

          {/* Voice Interface */}
          <div className="border-t border-slate-100 pt-2">
            <VoiceAssistant 
              conversationId={negotiation.conversationId}
              onUserTranscript={(text) => {
                // Optimistic UI update could go here
              }}
              onTranscript={(text) => {
                // Streaming text updates handled by query polling for now
                // Real-time would update local cache here
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
