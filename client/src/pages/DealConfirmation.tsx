import { useParams, useLocation } from "wouter";
import { useNegotiation } from "@/hooks/use-negotiations";
import { motion } from "framer-motion";

export default function DealConfirmation() {
  const { id } = useParams();
  const negotiationId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { data: negotiation, isLoading } = useNegotiation(negotiationId);

  if (isLoading || !negotiation) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalAmount = (negotiation.finalPrice || negotiation.product.price) * 5; // Assuming 5kg

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-[430px] mx-auto flex-col bg-white overflow-x-hidden shadow-2xl">
      {/* Top App Bar */}
      <div className="flex items-center bg-white p-4 pb-2 justify-between sticky top-0 z-10">
        <div className="text-[#111418] flex size-12 shrink-0 items-center justify-start cursor-pointer">
          <button onClick={() => setLocation("/")}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Confirmation
        </h2>
      </div>

      {/* Success Icon & Header */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center pt-8 pb-4"
      >
        <div className="size-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-green-500 text-5xl font-bold">check_circle</span>
        </div>
        <h1 className="text-[#111418] tracking-light text-[32px] font-bold leading-tight px-4 text-center">
          Deal Confirmed!
        </h1>
        <p className="text-green-600 text-base font-normal mt-1">Transaction successful</p>
      </motion.div>

      {/* Receipt Card */}
      <div className="p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-stretch justify-start rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-white border border-gray-100"
        >
          <div className="flex w-full grow flex-col items-stretch justify-center gap-4 p-5">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <p className="text-[#111418] text-xl font-bold leading-tight tracking-[-0.015em]">
                  ₹{totalAmount} Total
                </p>
                <p className="text-[#618961] text-sm font-medium">Order ID: #TRD-{negotiation.id}821</p>
              </div>
              <span className="material-symbols-outlined text-green-500">receipt_long</span>
            </div>
            <div className="h-[1px] bg-gray-100 w-full"></div>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-lg bg-center bg-no-repeat bg-cover"
                style={{ backgroundImage: `url(${negotiation.product.imageUrl})` }}
              />
              <div className="flex flex-col">
                <p className="text-[#111418] text-base font-semibold">5 kg {negotiation.product.name}</p>
                <p className="text-[#618961] text-sm">₹{negotiation.finalPrice || negotiation.product.price} / kg</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Vendor Information */}
      <div className="px-4">
        <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] pb-3 pt-4">
          Vendor Information
        </h3>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-background-light mb-4"
        >
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">storefront</span>
          </div>
          <div className="flex-1">
            <p className="text-[#111418] font-bold text-base">Sanjay's Fruit Shop</p>
            <p className="text-[#618961] text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">location_on</span> Mumbai Market
            </p>
          </div>
        </motion.div>

        {/* Map Snippet */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full h-32 rounded-xl bg-center bg-no-repeat bg-cover relative overflow-hidden mb-6 bg-gray-200"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="material-symbols-outlined text-red-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
          </div>
        </motion.div>
      </div>

      {/* Next Steps Checklist */}
      <div className="px-4 pb-8">
        <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] pb-4">Next Steps</h3>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">1</div>
            <p className="text-[#111418] text-base font-medium">Go to shop</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-sm">2</div>
            <p className="text-[#111418] text-base font-medium">Show this screen</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-sm">3</div>
            <p className="text-[#111418] text-base font-medium">Collect items</p>
          </div>
        </motion.div>
      </div>

      {/* Primary Action Buttons */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-4 flex flex-col gap-3 pb-32"
      >
        <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-green-500 text-white text-base font-bold leading-normal">
          <span className="truncate">Save Receipt</span>
        </button>
        <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-white border-2 border-green-500/20 text-[#111418] text-base font-bold leading-normal">
          <span className="material-symbols-outlined mr-2">share</span>
          <span className="truncate">Share</span>
        </button>
        <button 
          onClick={() => setLocation("/")}
          className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-transparent text-[#618961] text-sm font-medium leading-normal"
        >
          <span className="truncate">Continue Shopping</span>
        </button>
      </motion.div>

      {/* Voice Assistant Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="flex items-center gap-4 bg-background-light rounded-full px-4 py-3 shadow-sm border border-green-500/10">
          <div className="flex gap-1">
            <span className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></span>
            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
            <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <div className="flex-1">
            <p className="text-[#111418] text-sm font-medium leading-tight">
              "Deal saved. Say <span className="text-green-500 font-bold">Directions</span> to find the shop."
            </p>
          </div>
          <span className="material-symbols-outlined text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>
            mic
          </span>
        </div>
        {/* iOS Home Indicator */}
        <div className="w-32 h-1.5 bg-gray-200 mx-auto mt-6 rounded-full"></div>
      </div>
    </div>
  );
}