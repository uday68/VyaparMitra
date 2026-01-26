import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function VoiceSettings() {
  const [, setLocation] = useLocation();
  const [selectedVoice, setSelectedVoice] = useState("male");
  const [highContrastWaveform, setHighContrastWaveform] = useState(true);
  const [voiceShortcuts, setVoiceShortcuts] = useState([
    { id: 1, phrase: "Check current stock", recorded: true },
    { id: 2, phrase: "Open my shop", recorded: false },
    { id: 3, phrase: "Customer support", recorded: true }
  ]);

  const handleSave = () => {
    // Save voice settings logic
    console.log("Saving voice settings...");
    setLocation("/vendor");
  };

  const handleAddShortcut = () => {
    const newShortcut = {
      id: voiceShortcuts.length + 1,
      phrase: "New voice command",
      recorded: false
    };
    setVoiceShortcuts([...voiceShortcuts, newShortcut]);
  };

  return (
    <div className="bg-[#f7f5f8] font-display min-h-screen flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#dfdbe6]">
        <div className="flex items-center px-4 py-4 justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLocation("/vendor")}
              className="text-[#141118] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-[#141118] text-xl font-bold leading-tight tracking-[-0.015em]">
              Voice Settings
            </h1>
          </div>
          <button 
            onClick={handleSave}
            className="text-[#8743f4] cursor-pointer font-semibold"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto overflow-y-auto">
        {/* Assistant Voice Section */}
        <section className="py-4">
          <h2 className="text-[#141118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">
            Assistant Voice
          </h2>
          <div className="px-4 space-y-3">
            {/* Male Voice Option */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className={`flex h-16 items-center justify-between rounded-xl p-4 shadow-sm cursor-pointer ${
                selectedVoice === "male" 
                  ? "bg-white border-2 border-[#8743f4]" 
                  : "bg-white border border-[#dfdbe6]"
              }`}
              onClick={() => setSelectedVoice("male")}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${
                  selectedVoice === "male" ? "text-[#8743f4]" : "text-[#70608a]"
                }`}>
                  person
                </span>
                <span className="text-[#141118] font-bold text-lg">Male</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#70608a] cursor-pointer">
                  play_circle
                </span>
                <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${
                  selectedVoice === "male" 
                    ? "border-[#8743f4] bg-[#8743f4]" 
                    : "border-[#dfdbe6]"
                }`}>
                  {selectedVoice === "male" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Female Voice Option */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className={`flex h-16 items-center justify-between rounded-xl p-4 shadow-sm cursor-pointer ${
                selectedVoice === "female" 
                  ? "bg-white border-2 border-[#8743f4]" 
                  : "bg-white border border-[#dfdbe6]"
              }`}
              onClick={() => setSelectedVoice("female")}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#70608a]">person_2</span>
                <span className="text-[#141118] font-bold text-lg">Female</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#70608a] cursor-pointer">
                  play_circle
                </span>
                <div className="w-6 h-6 rounded-full border-2 border-[#dfdbe6]"></div>
              </div>
            </motion.div>

            {/* Neutral Voice Option */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              className={`flex h-16 items-center justify-between rounded-xl p-4 shadow-sm cursor-pointer ${
                selectedVoice === "neutral" 
                  ? "bg-white border-2 border-[#8743f4]" 
                  : "bg-white border border-[#dfdbe6]"
              }`}
              onClick={() => setSelectedVoice("neutral")}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#70608a]">face</span>
                <span className="text-[#141118] font-bold text-lg">Neutral</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#70608a] cursor-pointer">
                  play_circle
                </span>
                <div className="w-6 h-6 rounded-full border-2 border-[#dfdbe6]"></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Visual Feedback Section */}
        <section className="py-4">
          <h2 className="text-[#141118] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3">
            Visual Feedback
          </h2>
          <div className="p-4 pt-0">
            <div className="flex flex-1 flex-col items-start justify-between gap-4 rounded-xl border border-[#dfdbe6] bg-white p-5">
              <div className="flex w-full justify-between items-center">
                <div className="flex flex-col gap-1">
                  <p className="text-[#141118] text-lg font-bold leading-tight">
                    High-Contrast Waveform
                  </p>
                  <p className="text-[#70608a] text-sm font-normal leading-normal">
                    Show movement when AI talks
                  </p>
                </div>
                <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-[#f2f0f5] p-0.5 has-[:checked]:justify-end has-[:checked]:bg-[#8743f4]">
                  <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                  <input 
                    checked={highContrastWaveform}
                    onChange={(e) => setHighContrastWaveform(e.target.checked)}
                    className="invisible absolute" 
                    type="checkbox"
                  />
                </label>
              </div>

              {/* Live Waveform Preview */}
              <div className="w-full h-24 bg-[#f2f0f5] rounded-lg flex items-center justify-center gap-1 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 bg-[#8743f4] rounded-full"
                    animate={{
                      height: highContrastWaveform 
                        ? [32, 48, 64, 56, 72, 56, 40, 24][i] 
                        : [16, 24, 32, 28, 36, 28, 20, 12][i]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Voice Command Shortcuts */}
        <section className="py-4">
          <div className="flex justify-between items-center px-4 pb-3">
            <h2 className="text-[#141118] text-[22px] font-bold leading-tight tracking-[-0.015em]">
              Voice Shortcuts
            </h2>
            <button 
              onClick={handleAddShortcut}
              className="text-[#8743f4] font-bold flex items-center gap-1 text-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add New
            </button>
          </div>
          <div className="px-4 space-y-2">
            {voiceShortcuts.map((shortcut) => (
              <motion.div
                key={shortcut.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-white border border-[#dfdbe6] rounded-xl"
              >
                <div className="flex flex-col">
                  <span className="text-[#141118] font-bold">"{shortcut.phrase}"</span>
                  <span className={`text-xs flex items-center gap-1 ${
                    shortcut.recorded ? "text-[#70608a]" : "text-[#8743f4]"
                  }`}>
                    <span className="material-symbols-outlined text-xs">
                      {shortcut.recorded ? "mic" : "warning"}
                    </span>
                    {shortcut.recorded ? "Recorded" : "No tag recorded"}
                  </span>
                </div>
                <button className={`px-4 py-2 rounded-lg font-bold text-sm ${
                  shortcut.recorded 
                    ? "bg-[#f2f0f5] text-[#141118]" 
                    : "bg-[#8743f4] text-white"
                }`}>
                  {shortcut.recorded ? "Update" : "Record"}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="px-4 py-6">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full bg-[#8743f4] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#8743f4]/20 text-lg"
          >
            Save Voice Settings
          </motion.button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#dfdbe6] px-6 py-2">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex flex-col items-center gap-1 text-[#70608a]">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#8743f4]">
            <span className="material-symbols-outlined">settings_voice</span>
            <span className="text-[10px] font-bold">Voice</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#70608a]">
            <span className="material-symbols-outlined">bar_chart</span>
            <span className="text-[10px] font-medium">Analytics</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#70608a]">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-[10px] font-medium">Profile</span>
          </div>
        </div>
      </nav>
    </div>
  );
}