import { useParams, useLocation } from "wouter";
import { useNegotiation, useUpdateNegotiationStatus } from "@/hooks/use-negotiations";
import { useConversation, useSendMessage } from "@/hooks/use-chat";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function CustomerNegotiation() {
  const { id } = useParams();
  const negotiationId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  
  const { data: negotiation, isLoading: isLoadingNeg } = useNegotiation(negotiationId);
  const { data: conversation, isLoading: isLoadingConv } = useConversation(negotiation?.conversationId || 0);
  const updateStatus = useUpdateNegotiationStatus();
  const sendMessage = useSendMessage();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

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
      finalPrice: 180 // Current vendor offer
    });
    setLocation(`/confirmation/${negotiationId}`);
  };

  const handleCounter = async () => {
    await sendMessage.mutateAsync({
      id: negotiation.conversationId,
      content: "Counter offer: ₹175 for 5kg"
    });
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="relative flex h-screen w-full flex-col max-w-[430px] mx-auto bg-white overflow-hidden shadow-2xl">
      {/* TopAppBar */}
      <div className="flex items-center bg-white p-4 pb-2 justify-between border-b sticky top-0 z-10">
        <div className="text-[#111418] flex size-12 shrink-0 items-center justify-start cursor-pointer">
          <button onClick={() => setLocation("/")}>
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
        </div>
        <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Sanjay (Vendor)
        </h2>
        <div className="flex w-12 items-center justify-end">
          <p className="text-primary text-sm font-bold leading-normal tracking-[0.015em] shrink-0 cursor-pointer">
            English
          </p>
        </div>
      </div>

      {/* Negotiation Summary Card */}
      <div className="p-4 bg-white">
        <div className="flex items-stretch justify-between gap-4 rounded-xl border border-gray-100 p-4 shadow-sm bg-gray-50">
          <div className="flex flex-col gap-1 flex-[2_2_0px]">
            <div className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit mb-1">
              Live Offer
            </div>
            <p className="text-[#111418] text-lg font-bold leading-tight">Apples • 5 kg</p>
            <p className="text-[#637388] text-sm font-normal">
              Your offer: <span className="font-semibold text-[#111418]">₹170/kg</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-amber-600 text-sm font-bold leading-normal">Vendor countered ₹180</p>
            </div>
          </div>
          <div 
            className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded-lg shrink-0"
            style={{ backgroundImage: 'url("/images/apples.jpg")' }}
          />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col" ref={scrollRef}>
        {/* Vendor Message */}
        <div className="flex items-end gap-3 max-w-[85%]">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0"
            style={{ backgroundImage: 'url("/images/vendor-profile.jpg")' }}
          />
          <div className="flex flex-1 flex-col gap-1 items-start">
            <p className="text-[#637388] text-[11px] font-medium ml-1">Sanjay</p>
            <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-bl-none px-4 py-3 bg-[#f0f2f4] text-[#111418] shadow-sm">
              The apples are fresh from the orchard today. I can't go below ₹180 for this quality. They are premium Shimla apples.
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex items-end gap-3 justify-end max-w-[85%] ml-auto">
          <div className="flex flex-1 flex-col gap-1 items-end">
            <p className="text-[#637388] text-[11px] font-medium mr-1">You</p>
            <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-br-none px-4 py-3 bg-primary text-white shadow-sm">
              Can we do ₹170? I'm buying 5 kg for the whole week.
            </div>
          </div>
          <div className="bg-primary/20 flex items-center justify-center rounded-full w-8 h-8 shrink-0">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
        </div>

        {/* Vendor Counter */}
        <div className="flex items-end gap-3 max-w-[85%]">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 shrink-0"
            style={{ backgroundImage: 'url("/images/vendor-profile.jpg")' }}
          />
          <div className="flex flex-1 flex-col gap-1 items-start">
            <p className="text-[#637388] text-[11px] font-medium ml-1">Sanjay</p>
            <div className="text-sm font-normal leading-relaxed rounded-2xl rounded-bl-none px-4 py-3 bg-[#f0f2f4] text-[#111418] shadow-sm">
              Sir, ₹180 is the best I can do. These are the finest in the market right now.
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
                isUser ? "justify-end ml-auto" : "justify-start"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 bg-cover bg-center",
                isUser ? "bg-primary/20 flex items-center justify-center order-2" : ""
              )} 
                style={!isUser ? { backgroundImage: 'url("/images/vendor-profile.jpg")' } : {}}
              >
                {isUser && <span className="material-symbols-outlined text-primary text-sm">person</span>}
              </div>
              
              <div className={cn("flex flex-1 flex-col gap-1", isUser ? "items-end" : "items-start")}>
                <p className="text-[#637388] text-[11px] font-medium px-1">
                  {isUser ? "You" : "Sanjay"}
                </p>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm font-normal leading-relaxed shadow-sm",
                  isUser 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-[#f0f2f4] text-[#111418] rounded-bl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Negotiation Controls */}
      <div className="bg-white border-t p-4 pb-8 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {/* Quick Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleAccept}
            className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Accept ₹180
          </button>
          <button 
            onClick={handleCounter}
            className="flex-1 bg-white border-2 border-primary text-primary font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Offer ₹175
          </button>
        </div>

        {/* Voice Command Footer */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="text-center">
            <h3 className="text-[#111418] tracking-tight text-lg font-bold leading-tight px-4">
              Say "Accept ₹180" or "Offer ₹175"
            </h3>
            <p className="text-[#637388] text-xs mt-1">
              {isListening ? "Listening for voice command..." : "Tap mic to speak"}
            </p>
          </div>

          {/* Waveform Graphic */}
          {isListening && (
            <div className="flex items-center justify-center h-12 w-full">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full mx-0.5 animate-pulse"
                  style={{
                    height: `${Math.random() * 32 + 8}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Mic Button */}
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 bg-primary/20 rounded-full scale-150 animate-pulse"></div>
            )}
            <button 
              onClick={toggleListening}
              className={cn(
                "relative text-white size-16 rounded-full flex items-center justify-center shadow-lg transition-all",
                isListening ? "bg-red-500 shadow-red-500/40" : "bg-primary shadow-primary/40"
              )}
            >
              <span className="material-symbols-outlined text-3xl">
                {isListening ? "stop" : "mic"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Home Indicator */}
      <div className="h-1.5 w-32 bg-gray-300 rounded-full mx-auto mb-2 shrink-0"></div>
    </div>
  );
}