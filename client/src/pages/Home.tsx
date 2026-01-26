import { useProducts } from "@/hooks/use-products";
import { useCreateNegotiation } from "@/hooks/use-negotiations";
import { ProductCard } from "@/components/ProductCard";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { Product } from "@shared/schema";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Home() {
  const { data: products, isLoading } = useProducts();
  const createNegotiation = useCreateNegotiation();
  const [, setLocation] = useLocation();

  const handleBid = async (product: Product) => {
    try {
      const negotiation = await createNegotiation.mutateAsync({
        productId: product.id,
        initialMessage: "Starting negotiation for " + product.name
      });
      setLocation(`/chat/${negotiation.id}`);
    } catch (error) {
      console.error("Failed to start negotiation", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <Header />

      <main className="flex-1 px-4 pt-4 space-y-4">
        {/* Search Bar */}
        <div className="sticky top-[60px] z-40 bg-slate-50 pb-2">
          <div className="flex w-full items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-12 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="pl-4 text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              type="text" 
              placeholder="Search for fruits..." 
              className="w-full h-full px-3 outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {products?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBid={handleBid}
                isPending={createNegotiation.isPending}
              />
            ))}
          </motion.div>
        )}
      </main>

      <div className="fixed bottom-20 left-4 right-4 z-40">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl p-4 flex items-center gap-4 shadow-lg ring-1 ring-primary/10"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping opacity-75"></div>
            <div className="bg-primary text-white size-10 rounded-full flex items-center justify-center relative z-10 shadow-lg">
              <span className="material-symbols-outlined text-lg">mic</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-primary text-xs font-bold uppercase tracking-wider mb-0.5">Voice Assistant</p>
            <p className="text-slate-700 text-sm font-medium leading-snug">
              Say "I want to buy apples" to start
            </p>
          </div>
          <button className="text-primary/60 hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
