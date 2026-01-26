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
    <div className="flex items-center justify-center mt-2">
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.2 }}
              exit={{ scale: 1 }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
              className="absolute w-16 h-16 bg-primary/20 rounded-full"
            />
          )}
        </AnimatePresence>

        <button
          onClick={handleMicClick}
          disabled={isProcessing}
          className={cn(
            "relative bg-primary text-white size-16 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 z-20",
            isProcessing && "bg-gray-400 shadow-none cursor-not-allowed"
          )}
        >
          <span className="material-symbols-outlined text-3xl">
            {isProcessing ? "hourglass_empty" : isRecording ? "mic" : "mic"}
          </span>
        </button>
        
        <div className="absolute -bottom-6 text-[10px] font-bold text-primary uppercase tracking-[2px]">
          {isRecording ? "Listening..." : isProcessing ? "Processing..." : isPlaying ? "Speaking..." : "Tap to Speak"}
        </div>
      </div>
    </div>
  );
}
