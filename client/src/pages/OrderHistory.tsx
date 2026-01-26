import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

interface Order {
  id: number;
  customerName: string;
  product: string;
  amount: number;
  time: string;
  status: "completed" | "pending" | "cancelled";
  imageUrl: string;
}

export default function OrderHistory() {
  const [, setLocation] = useLocation();
  const [voiceCommand, setVoiceCommand] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [orders] = useState<Order[]>([
    {
      id: 1,
      customerName: "Sarah",
      product: "5kg Apples",
      amount: 900,
      time: "10:30 AM",
      status: "completed",
      imageUrl: "/images/apples.jpg"
    },
    {
      id: 2,
      customerName: "Rajesh",
      product: "2kg Mangoes",
      amount: 400,
      time: "09:15 AM",
      status: "completed",
      imageUrl: "/images/mangoes.jpg"
    },
    {
      id: 3,
      customerName: "Anjali",
      product: "3kg Bananas",
      amount: 150,
      time: "Yesterday",
      status: "completed",
      imageUrl: "/images/bananas.jpg"
    }
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const completedOrders = orders.filter(order => order.status === "completed").length;

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setVoiceCommand("Show yesterday's sales");
      // Simulate voice processing
      setTimeout(() => {
        setIsListening(false);
        setVoiceCommand("");
      }, 3000);
    }
  };

  return (
    <div className="bg-[#f6f8f6] text-[#111811] transition-colors duration-300">
      {/* Main Container */}
      <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[480px] mx-auto shadow-2xl bg-white">
        {/* Top App Bar */}
        <header className="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 justify-between">
          <div className="flex size-12 items-center justify-start">
            <button onClick={() => setLocation("/vendor")}>
              <span className="material-symbols-outlined text-[#111811] cursor-pointer">menu</span>
            </button>
          </div>
          <h2 className="text-[#111811] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-display">
            Order History
          </h2>
          <div className="flex size-12 items-center justify-end">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-gray-100 transition-colors">
              <span className="material-symbols-outlined text-[#111811]">search</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-40">
          {/* Summary Dashboard Card */}
          <div className="p-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-stretch justify-start rounded-xl shadow-sm bg-[#11d411]/10 border border-[#11d411]/20 overflow-hidden"
            >
              <div className="flex w-full flex-col items-stretch justify-center gap-1 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#11d411] font-semibold text-sm uppercase tracking-wider">
                    Daily Summary
                  </p>
                  <span className="material-symbols-outlined text-[#11d411]">analytics</span>
                </div>
                <p className="text-[#111811] text-3xl font-bold leading-tight tracking-tight">
                  ₹{totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="material-symbols-outlined text-sm text-[#11d411]/80">check_circle</span>
                  <p className="text-[#618961] text-base font-medium">
                    {completedOrders} Completed Orders Today
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Transactions Header */}
          <div className="flex items-center justify-between px-4 pb-2 pt-2">
            <h3 className="text-[#111811] text-lg font-bold leading-tight tracking-tight font-display">
              Recent Transactions
            </h3>
            <span className="text-[#11d411] text-sm font-semibold cursor-pointer">View All</span>
          </div>

          {/* Transaction List */}
          <div className="space-y-1">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="px-4 py-2"
              >
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#11d411] px-2 py-0.5 rounded-full bg-[#11d411]/10 uppercase">
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-400">{order.time}</span>
                    </div>
                    <div>
                      <p className="text-[#111811] text-lg font-bold leading-tight">
                        {order.customerName}
                      </p>
                      <p className="text-[#618961] text-sm font-medium">{order.product}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[#111811] font-bold text-lg">₹{order.amount}</p>
                      <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-[#f6f8f6] text-[#111811] text-sm font-semibold hover:bg-gray-200 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                  <div 
                    className="w-24 h-24 bg-center bg-no-repeat bg-cover rounded-lg shadow-inner"
                    style={{ backgroundImage: `url(${order.imageUrl})` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        {/* Fixed Bottom UI Section */}
        <div className="absolute bottom-0 left-0 w-full z-20">
          {/* Voice AI Assistant Bar */}
          <div className="px-4 pb-4">
            <motion.div 
              animate={{ 
                scale: isListening ? 1.02 : 1,
                borderColor: isListening ? "#11d411" : "rgba(17, 212, 17, 0.3)"
              }}
              className="flex items-center gap-3 bg-white border shadow-xl rounded-full p-2 pl-4"
            >
              <div className="flex-1 text-[#618961] text-sm italic truncate">
                {isListening ? "Listening..." : voiceCommand || '"Show yesterday\'s sales"'}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceCommand}
                className={`flex items-center justify-center h-10 w-10 rounded-full text-white shadow-lg transition-all ${
                  isListening ? "bg-red-500 shadow-red-500/30" : "bg-[#11d411] shadow-[#11d411]/30"
                }`}
              >
                <span className="material-symbols-outlined">
                  {isListening ? "stop" : "mic"}
                </span>
              </motion.button>
            </motion.div>
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="flex items-center justify-around bg-white border-t border-gray-100 h-20 px-4 pb-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#11d411] transition-colors">
                inventory_2
              </span>
              <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#11d411] uppercase tracking-tighter">
                Inventory
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#11d411] transition-colors">
                chat_bubble
              </span>
              <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#11d411] uppercase tracking-tighter">
                Negot.
              </span>
            </div>
            
            {/* Prominent QR Action */}
            <div className="flex flex-col items-center -mt-8">
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="bg-[#11d411] p-4 rounded-full shadow-lg shadow-[#11d411]/30 text-white mb-1 cursor-pointer"
              >
                <span className="material-symbols-outlined !text-3xl">qr_code_scanner</span>
              </motion.div>
              <span className="text-[10px] font-bold text-[#11d411] uppercase tracking-tighter">
                Pay/Receive
              </span>
            </div>
            
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <span className="material-symbols-outlined text-[#11d411]">history</span>
              <span className="text-[10px] font-bold text-[#11d411] uppercase tracking-tighter">
                History
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#11d411] transition-colors">
                settings
              </span>
              <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#11d411] uppercase tracking-tighter">
                Settings
              </span>
            </div>
          </nav>

          {/* iOS Home Indicator Overlay */}
          <div className="h-6 bg-white flex items-center justify-center">
            <div className="w-32 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}