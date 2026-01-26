import { useParams, useLocation } from "wouter";
import { useNegotiation, useUpdateNegotiationStatus } from "@/hooks/use-negotiations";
import { useConversation, useSendMessage } from "@/hooks/use-chat";
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
  const [currentOffer, setCurrentOffer] = useState("₹175");

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (isLoadingNeg || !negotiation) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAccept = async () => {
    await updateStatus.mutateAsync({
      id: negotiationId,
      status: "accepted",
      finalPrice: 175 // Parse from current offer
    });
    setLocation("/vendor");
  };

  const handleCounter = async () => {
    await sendMessage.mutateAsync({
      id: negotiation.conversationId,
      content: "Counter with ₹178"
    });
  };

  return (
    <div className="relative flex h-screen max-w-[430px] mx-auto flex-col bg-white overflow-hidden border-x border-gray-100 shadow-2xl">
      {/* TopAppBar */}
      <div className="flex items-center bg-white p-4 pb-2 justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="text-[#111418] flex size-10 shrink-0 items-center justify-start">
          <button onClick={() => setLocation("/vendor")}>
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
        </div>
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Sarah (Tourist)</h2>
          <div className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-500"></span>
            <p className="text-[#637388] text-xs font-medium">Online</p>
          </div>
        </div>
        <div className="flex w-12 items-center justify-end">
          <p className="text-primary text-sm font-bold leading-normal tracking-[0.015em] shrink-0 px-2 py-1 bg-primary/10 rounded-lg">English</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background-light">
          <div className="flex flex-col gap-1 flex-1">
            <p className="text-[#111418] text-base font-bold leading-tight">Apples • 5 kg • ₹180 offer</p>
            <p className="text-[#637388] text-xs font-normal leading-normal uppercase tracking-wider">Current Negotiation</p>
          </div>
          <div 
            className="w-16 h-16 bg-center bg-no-repeat bg-cover rounded-lg" 
            style={{ backgroundImage: 'url("/images/apples.jpg")' }}
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-light" ref={scrollRef}>
        {/* Sarah Message */}
        <div className="flex items-end gap-3 justify-start max-w-[85%]">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0 border border-gray-200" 
            style={{ backgroundImage: 'url("/images/sarah.jpg")' }}
          />
          <div className="flex flex-col gap-1 items-start">
            <p className="text-[#637388] text-[11px] font-medium ml-1">Sarah</p>
            <div className="relative">
              <p className="text-[15px] font-normal leading-normal rounded-2xl rounded-bl-none px-4 py-3 bg-white text-[#111418] shadow-sm">
                It's a bit expensive.
              </p>
            </div>
          </div>
        </div>

        {/* Vendor Message */}
        <div className="flex items-end gap-3 justify-end ml-auto max-w-[85%]">
          <div className="flex flex-col gap-1 items-end">
            <p className="text-[#637388] text-[11px] font-medium mr-1">Vendor (You)</p>
            <p className="text-[15px] font-normal leading-normal rounded-2xl rounded-br-none px-4 py-3 bg-primary text-white shadow-md">
              Fresh organic apples from my farm.
            </p>
          </div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0 bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-lg">storefront</span>
          </div>
        </div>

        {/* Sarah Message - Final Offer */}
        <div className="flex items-end gap-3 justify-start max-w-[85%]">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0 border border-gray-200" 
            style={{ backgroundImage: 'url("/images/sarah.jpg")' }}
          />
          <div className="flex flex-col gap-1 items-start">
            <p className="text-[#637388] text-[11px] font-medium ml-1">Sarah</p>
            <div className="relative group">
              <p className="text-[15px] font-normal leading-normal rounded-2xl rounded-bl-none px-4 py-3 bg-white text-[#111418] shadow-sm">
                ₹175? Final offer?
              </p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-primary/70 italic">
                <span className="material-symbols-outlined text-[12px]">translate</span>
                <span>Translated from English</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional messages from conversation */}
        {conversation?.messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-end gap-3 max-w-[85%]",
                isUser ? "justify-start" : "justify-end ml-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 bg-cover bg-center border",
                isUser ? "border-gray-200" : "bg-primary/20 border-primary/30 flex items-center justify-center"
              )} 
                style={isUser ? { backgroundImage: 'url("/images/sarah.jpg")' } : {}}
              >
                {!isUser && <span className="material-symbols-outlined text-primary text-lg">storefront</span>}
              </div>
              
              <div className={cn("flex flex-col gap-1", isUser ? "items-start" : "items-end")}>
                <p className="text-[#637388] text-[11px] font-medium px-1">
                  {isUser ? "Sarah" : "Vendor (You)"}
                </p>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] font-normal leading-normal shadow-sm",
                  isUser 
                    ? "bg-white text-[#111418] rounded-bl-none" 
                    : "bg-primary text-white rounded-br-none shadow-md"
                )}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Voice Assistant Panel */}
      <div className="bg-white border-t border-gray-100 px-4 pt-6 pb-8 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] rounded-t-3xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <div className="bg-primary text-white p-2 rounded-full">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
            </div>
            <div className="flex-1">
              <p className="text-[#111418] text-[15px] font-medium leading-snug">
                Sarah says: <span className="text-primary font-bold">"₹175? Final offer?"</span>
              </p>
              <p className="text-[#637388] text-sm mt-1">
                Say <span className="font-bold text-green-600">"Accept"</span> or <span className="font-bold text-primary">"Counter with 178"</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Accept
            </button>
            <button 
              onClick={handleCounter}
              className="flex-1 bg-white border border-primary/30 text-primary font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">edit</span>
              Counter
            </button>
          </div>

          {/* Voice Interface */}
          <VoiceAssistant 
            conversationId={negotiation.conversationId}
            onUserTranscript={(text) => {
              // Handle voice input
            }}
            onTranscript={(text) => {
              // Handle AI response
            }}
          />
        </div>
      </div>

      {/* iOS Home Indicator */}
      <div className="flex justify-center pb-2 bg-white">
        <div className="w-32 h-1.5 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  );
}
