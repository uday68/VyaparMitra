import { useState, useEffect } from "react";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceAssistantProps {
  conversationId: number;
  onTranscript?: (text: string) => void;
  onUserTranscript?: (text: string) => void;
}

export function VoiceAssistant({ conversationId, onTranscript, onUserTranscript }: VoiceAssistantProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recorder = useVoiceRecorder();
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      onUserTranscript?.(text);
    },
    onTranscript: (_, full) => {
      onTranscript?.(full);
    },
    onComplete: () => {
      setIsProcessing(false);
    },
    onError: (err) => {
      console.error("Voice stream error:", err);
      setIsProcessing(false);
    }
  });

  const handleMicClick = async () => {
    if (recorder.state === "recording") {
      setIsProcessing(true);
      const blob = await recorder.stopRecording();
      try {
        await stream.streamVoiceResponse(
          `/api/conversations/${conversationId}/messages`,
          blob
        );
      } catch (e) {
        setIsProcessing(false);
        console.error("Failed to stream voice", e);
      }
    } else {
      await recorder.startRecording();
    }
  };

  const isRecording = recorder.state === "recording";
  const isPlaying = stream.playbackState === "playing";

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {(isRecording || isPlaying || isProcessing) && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.5 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className={cn(
                "absolute w-16 h-16 rounded-full",
                isRecording ? "bg-red-500/20" : "bg-primary/20"
              )}
            />
          )}
        </AnimatePresence>

        <button
          onClick={handleMicClick}
          disabled={isProcessing || isPlaying}
          className={cn(
            "relative size-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-10",
            isRecording 
              ? "bg-red-500 text-white shadow-red-500/30 scale-110" 
              : "bg-primary text-white shadow-primary/30 hover:shadow-xl hover:-translate-y-1",
            (isProcessing || isPlaying) && "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
          )}
        >
          <span className="material-symbols-outlined text-3xl">
            {isProcessing ? "hourglass_empty" : isPlaying ? "volume_up" : isRecording ? "stop" : "mic"}
          </span>
        </button>
      </div>
      
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[2px] text-primary/80 h-4">
        {isRecording ? "Listening..." : isProcessing ? "Thinking..." : isPlaying ? "Speaking..." : "Tap to Speak"}
      </p>
    </div>
  );
}
