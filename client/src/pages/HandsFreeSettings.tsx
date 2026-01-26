import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function HandsFreeSettings() {
  const [, setLocation] = useLocation();
  const [wakeWord, setWakeWord] = useState("hey-assistant");
  const [volume, setVolume] = useState(75);
  const [voiceLog, setVoiceLog] = useState([
    {
      id: 1,
      command: "Check my inventory",
      recognized: "Inventory Check",
      status: "success",
      time: "2m ago"
    },
    {
      id: 2,
      command: "Add $10 to customer credit",
      recognized: "Update Balance",
      status: "success",
      time: "15m ago"
    },
    {
      id: 3,
      command: "Hey... order more...",
      recognized: "Partially Recognized",
      status: "partial",
      time: "1h ago"
    }
  ]);

  const handleEnableMode = () => {
    console.log("Enabling hands-free mode...");
  };

  const handleClearLog = () => {
    setVoiceLog([]);
  };

  return (
    <div className="bg-[#f7f5f8] min-h-screen text-[#141118] transition-colors duration-200">
      <div className="relative mx-auto max-w-[480px] min-h-screen flex flex-col overflow-x-hidden">
        {/* TopAppBar */}
        <header className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-10 border-b border-[#dfdbe6]">
          <button 
            onClick={() => setLocation("/vendor")}
            className="text-[#141118] flex size-12 shrink-0 items-center cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <h2 className="text-[#141118] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Hands-Free Mode
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto pb-10">
          {/* Safety Disclaimer Card */}
          <div className="p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-stretch justify-start rounded-xl shadow-sm bg-white border border-[#dfdbe6] overflow-hidden"
            >
              <div 
                className="w-full bg-center bg-no-repeat aspect-video bg-cover bg-gray-200 flex items-center justify-center"
              >
                <div className="text-center">
                  <span className="material-symbols-outlined text-[#8743f4] text-6xl mb-2 block">
                    record_voice_over
                  </span>
                  <p className="text-[#8743f4] font-semibold">Always-On Voice Assistant</p>
                </div>
              </div>
              <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-1 py-4 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
                  <p className="text-[#70608a] text-sm font-semibold uppercase tracking-wider">
                    Safety Disclaimer
                  </p>
                </div>
                <p className="text-[#141118] text-xl font-bold leading-tight tracking-[-0.015em]">
                  Always-On Voice Listening
                </p>
                <div className="mt-2">
                  <p className="text-[#70608a] text-base font-normal leading-normal">
                    Turning this on allows the app to listen for commands even when the screen is off.
                  </p>
                  <p className="text-[#70608a] text-sm font-medium leading-normal mt-2 italic">
                    Note: This may impact battery life.
                  </p>
                </div>
                <div className="flex items-center gap-3 justify-between mt-4 pt-4 border-t border-[#dfdbe6]">
                  <span className="text-sm font-medium text-[#141118]">Active Mode</span>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnableMode}
                    className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-[#8743f4] text-white text-sm font-semibold leading-normal shadow-lg shadow-[#8743f4]/30"
                  >
                    <span className="truncate">Enable Now</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Wake Word Selection Section */}
          <div className="bg-transparent">
            <h3 className="text-[#141118] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Wake Word Selection
            </h3>
            <div className="flex flex-col gap-3 p-4">
              <motion.label 
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 rounded-xl border border-solid p-[15px] flex-row-reverse transition-all cursor-pointer group ${
                  wakeWord === "hey-assistant" 
                    ? "border-[#8743f4] bg-white" 
                    : "border-[#dfdbe6] bg-white hover:border-[#8743f4]"
                }`}
              >
                <input 
                  checked={wakeWord === "hey-assistant"}
                  onChange={() => setWakeWord("hey-assistant")}
                  className="h-5 w-5 border-2 border-[#dfdbe6] bg-transparent text-transparent checked:border-[#8743f4] checked:bg-[#8743f4] focus:outline-none focus:ring-0 focus:ring-offset-0"
                  name="wake-word" 
                  type="radio"
                />
                <div className="flex grow flex-col">
                  <p className="text-[#141118] text-sm font-semibold leading-normal group-hover:text-[#8743f4] transition-colors">
                    Hey Assistant
                  </p>
                  <p className="text-[#70608a] text-xs font-normal leading-normal">
                    Default activation phrase
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#70608a]">record_voice_over</span>
              </motion.label>

              <motion.label 
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 rounded-xl border border-solid p-[15px] flex-row-reverse transition-all cursor-pointer group ${
                  wakeWord === "ok-shop" 
                    ? "border-[#8743f4] bg-white" 
                    : "border-[#dfdbe6] bg-white hover:border-[#8743f4]"
                }`}
              >
                <input 
                  checked={wakeWord === "ok-shop"}
                  onChange={() => setWakeWord("ok-shop")}
                  className="h-5 w-5 border-2 border-[#dfdbe6] bg-transparent text-transparent checked:border-[#8743f4] checked:bg-[#8743f4] focus:outline-none focus:ring-0 focus:ring-offset-0"
                  name="wake-word" 
                  type="radio"
                />
                <div className="flex grow flex-col">
                  <p className="text-[#141118] text-sm font-semibold leading-normal group-hover:text-[#8743f4] transition-colors">
                    Ok Shop
                  </p>
                  <p className="text-[#70608a] text-xs font-normal leading-normal">
                    Shop-specific activation
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#70608a]">storefront</span>
              </motion.label>
            </div>
          </div>

          {/* Audio Settings Section */}
          <div className="bg-transparent mt-2">
            <h3 className="text-[#141118] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Audio Settings
            </h3>
            <div className="p-4 pt-2">
              <div className="bg-white border border-[#dfdbe6] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#141118] text-sm font-medium">AI Response Volume</p>
                  <span className="text-xs font-bold text-[#8743f4] px-2 py-1 bg-[#8743f4]/10 rounded">
                    {volume}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#70608a] text-lg">volume_mute</span>
                  <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                    <div 
                      className="absolute h-full bg-[#8743f4] rounded-full transition-all" 
                      style={{ width: `${volume}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="material-symbols-outlined text-[#70608a] text-lg">volume_up</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Voice Log */}
          <div className="bg-transparent mt-2">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <h3 className="text-[#141118] text-lg font-bold leading-tight tracking-[-0.015em]">
                Recent Voice Log
              </h3>
              <button 
                onClick={handleClearLog}
                className="text-[#8743f4] text-sm font-semibold"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {voiceLog.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-2 p-4 bg-white border border-[#dfdbe6] rounded-xl shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        log.status === "success" 
                          ? "bg-[#8743f4]/10 text-[#8743f4]" 
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        <span className="material-symbols-outlined text-sm">
                          {log.status === "success" ? "mic" : "mic_off"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[#141118] text-sm font-medium italic">"{log.command}"</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          log.status === "success" 
                            ? "text-green-600" 
                            : log.status === "partial" 
                            ? "text-amber-500" 
                            : "text-red-500"
                        }`}>
                          <span className="material-symbols-outlined text-xs">
                            {log.status === "success" ? "check_circle" : "help"}
                          </span>
                          <p className="text-xs font-semibold">
                            {log.status === "success" ? `Recognized: ${log.recognized}` : log.recognized}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#70608a] font-medium">{log.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer Spacing */}
          <div className="h-10"></div>
        </main>

        {/* Navigation */}
        <nav className="h-20 border-t border-[#dfdbe6] bg-white flex items-center justify-around px-6">
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[#8743f4]">
            <span className="material-symbols-outlined">settings_voice</span>
            <span className="text-[10px] font-medium">Voice</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-[10px] font-medium">Stats</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </div>
        </nav>
      </div>
    </div>
  );
}