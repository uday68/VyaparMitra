import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function VoiceCustomization() {
  const [, setLocation] = useLocation();
  const [assistantProfile, setAssistantProfile] = useState("natural");
  const [language, setLanguage] = useState("hindi");
  const [speakingSpeed, setSpeakingSpeed] = useState(1.0);
  const [autoReadBids, setAutoReadBids] = useState(true);
  const [voiceConfirmation, setVoiceConfirmation] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const handleTestVoice = () => {
    setIsTestingVoice(true);
    // Simulate voice test
    setTimeout(() => {
      setIsTestingVoice(false);
    }, 3000);
  };

  return (
    <div className="bg-background-light font-display text-[#111418] min-h-screen flex flex-col">
      <div className="relative flex min-h-screen w-full max-w-[430px] mx-auto flex-col bg-white shadow-xl overflow-x-hidden">
        {/* TopAppBar */}
        <div className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-10 border-b border-gray-100">
          <button 
            onClick={() => setLocation("/vendor")}
            className="text-[#111418] flex size-10 shrink-0 items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            Voice Settings
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          {/* Section: Assistant Profile */}
          <div className="pt-4">
            <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2">
              Assistant Profile
            </h3>
            <p className="text-sm text-gray-500 px-4 mb-2">
              Choose how your assistant responds to trade queries.
            </p>
            
            {/* SegmentedButtons */}
            <div className="flex px-4 py-3">
              <div className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#f0f2f4] p-1">
                <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold leading-normal transition-all ${
                  assistantProfile === "natural" 
                    ? "bg-white shadow-[0_0_4px_rgba(0,0,0,0.1)] text-primary" 
                    : "text-[#637388]"
                }`}>
                  <span className="truncate">Natural</span>
                  <input 
                    checked={assistantProfile === "natural"}
                    onChange={() => setAssistantProfile("natural")}
                    className="invisible w-0" 
                    name="feedback-style" 
                    type="radio" 
                    value="Natural"
                  />
                </label>
                <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold leading-normal transition-all ${
                  assistantProfile === "brief" 
                    ? "bg-white shadow-[0_0_4px_rgba(0,0,0,0.1)] text-primary" 
                    : "text-[#637388]"
                }`}>
                  <span className="truncate">Brief</span>
                  <input 
                    checked={assistantProfile === "brief"}
                    onChange={() => setAssistantProfile("brief")}
                    className="invisible w-0" 
                    name="feedback-style" 
                    type="radio" 
                    value="Brief"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4 my-2"></div>

          {/* Section: Voice Options */}
          <div className="pt-2">
            <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-4">
              Voice Options
            </h3>
            
            {/* Language Selection */}
            <div className="px-4 py-3">
              <label className="flex flex-col w-full">
                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Language</p>
                <div className="relative">
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none flex w-full min-w-0 flex-1 rounded-xl text-[#111418] focus:outline-0 focus:ring-2 focus:ring-primary border border-[#dce0e5] bg-white h-14 px-4 text-base font-normal leading-normal"
                  >
                    <option value="english">English (Global)</option>
                    <option value="hindi">Hindi (हिन्दी)</option>
                    <option value="spanish">Spanish (Español)</option>
                    <option value="french">French (Français)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Speaking Speed Slider */}
            <div className="px-4 py-3 mt-2">
              <p className="text-[#111418] text-base font-medium leading-normal pb-4">Speaking Speed</p>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-gray-400">slow_motion_video</span>
                <input 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  max="2.0" 
                  min="0.5" 
                  step="0.1" 
                  type="range" 
                  value={speakingSpeed}
                  onChange={(e) => setSpeakingSpeed(parseFloat(e.target.value))}
                />
                <span className="material-symbols-outlined text-gray-400">speed</span>
              </div>
              <div className="flex justify-between mt-2 px-1">
                <span className="text-xs text-gray-500">Slow</span>
                <span className="text-xs text-gray-500">Normal</span>
                <span className="text-xs text-gray-500">Fast</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4 my-4"></div>

          {/* Section: Automation */}
          <div className="pt-2">
            <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2">
              Automation
            </h3>
            
            {/* Auto-Read New Bids Toggle */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex flex-col gap-1">
                <p className="text-[#111418] text-base font-medium">Auto-Read New Bids</p>
                <p className="text-sm text-gray-500">Narrate incoming bids instantly</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  checked={autoReadBids}
                  onChange={(e) => setAutoReadBids(e.target.checked)}
                  className="sr-only peer" 
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Voice Confirmation Toggle */}
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex flex-col gap-1">
                <p className="text-[#111418] text-base font-medium">Voice Confirmation for Deals</p>
                <p className="text-sm text-gray-500">Ask for "Yes" to confirm a sale</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  checked={voiceConfirmation}
                  onChange={(e) => setVoiceConfirmation(e.target.checked)}
                  className="sr-only peer" 
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Floating Microphone Test Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="flex flex-col items-center gap-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleTestVoice}
              className={`flex items-center justify-center size-16 rounded-full shadow-lg transition-all ${
                isTestingVoice 
                  ? "bg-red-500 text-white shadow-red-500/30" 
                  : "bg-primary text-white shadow-primary/30"
              }`}
            >
              <span className="material-symbols-outlined text-3xl">
                {isTestingVoice ? "stop" : "mic"}
              </span>
            </motion.button>
            <p className="text-sm font-semibold text-primary">
              {isTestingVoice ? "Testing Voice..." : "Tap to Test Voice Commands"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}