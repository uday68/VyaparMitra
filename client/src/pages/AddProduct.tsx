import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "kg",
    stock: "",
    description: "",
    category: "fruits"
  });

  const handleSave = () => {
    // Save product logic here
    console.log("Saving product:", formData);
    setLocation("/vendor");
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="bg-background-light font-display text-[#111418] min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center p-4 justify-between max-w-[480px] mx-auto">
          <div className="flex size-12 shrink-0 items-center justify-start cursor-pointer">
            <button onClick={() => setLocation("/vendor")}>
              <span className="material-symbols-outlined text-[#111418]">arrow_back_ios</span>
            </button>
          </div>
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Add Product
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button 
              onClick={handleSave}
              className="text-primary text-base font-bold leading-normal tracking-[0.015em] cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-64 max-w-[480px] mx-auto w-full">
        {/* Add Photo Section */}
        <section className="px-4 py-4">
          <p className="text-[#111418] text-base font-medium leading-normal pb-3">Product Photos</p>
          <div className="flex gap-3">
            <button className="flex flex-col items-center justify-center flex-1 h-32 bg-[#f0f2f4] rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-1">add_a_photo</span>
              <span className="text-xs font-semibold text-[#637388]">Camera</span>
            </button>
            <button className="flex flex-col items-center justify-center flex-1 h-32 bg-[#f0f2f4] rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-200 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-1">file_upload</span>
              <span className="text-xs font-semibold text-[#637388]">Upload</span>
            </button>
          </div>
        </section>

        {/* Product Name Input */}
        <div className="px-4 py-3">
          <label className="flex flex-col w-full group">
            <p className="text-[#637388] text-sm font-medium pb-1 group-focus-within:text-primary transition-colors">
              Product Name
            </p>
            <input 
              className="w-full bg-transparent border-none border-b-2 border-gray-200 focus:border-primary p-0 pb-2 text-[#111418] text-lg focus:ring-0 placeholder:text-gray-300 transition-colors"
              placeholder="e.g. Red Apples"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </label>
        </div>

        {/* Price and Unit */}
        <div className="flex gap-4 px-4 py-3">
          <label className="flex flex-col flex-[2] group">
            <p className="text-[#637388] text-sm font-medium pb-1 group-focus-within:text-primary transition-colors">
              Price per unit
            </p>
            <div className="flex items-center border-b-2 border-gray-200 focus-within:border-primary transition-colors">
              <span className="text-[#111418] pr-1">₹</span>
              <input 
                className="w-full bg-transparent border-none p-0 pb-2 text-[#111418] text-lg focus:ring-0 placeholder:text-gray-300"
                placeholder="0.00"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </label>
          <label className="flex flex-col flex-1 group">
            <p className="text-[#637388] text-sm font-medium pb-1 group-focus-within:text-primary transition-colors">
              Unit
            </p>
            <select 
              className="w-full bg-transparent border-none border-b-2 border-gray-200 focus:border-primary p-0 pb-2 text-[#111418] text-lg focus:ring-0 cursor-pointer transition-colors"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            >
              <option value="kg">kg</option>
              <option value="pcs">pcs</option>
              <option value="ltr">ltr</option>
              <option value="box">box</option>
            </select>
          </label>
        </div>

        {/* Stock Available */}
        <div className="px-4 py-3">
          <label className="flex flex-col w-full group">
            <p className="text-[#637388] text-sm font-medium pb-1 group-focus-within:text-primary transition-colors">
              Stock Available
            </p>
            <input 
              className="w-full bg-transparent border-none border-b-2 border-gray-200 focus:border-primary p-0 pb-2 text-[#111418] text-lg focus:ring-0 placeholder:text-gray-300 transition-colors"
              placeholder="e.g. 50"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
            />
          </label>
        </div>

        {/* Description */}
        <div className="px-4 py-3">
          <label className="flex flex-col w-full group">
            <p className="text-[#637388] text-sm font-medium pb-1 group-focus-within:text-primary transition-colors">
              Description
            </p>
            <textarea 
              className="w-full bg-transparent border-none border-b-2 border-gray-200 focus:border-primary p-0 pb-2 text-[#111418] text-base focus:ring-0 placeholder:text-gray-300 resize-none min-h-[80px] transition-colors"
              placeholder="Fresh organic apples from the farm..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </label>
        </div>

        {/* Category Selection */}
        <section className="px-4 py-4">
          <p className="text-[#111418] text-base font-medium leading-normal pb-3">Category</p>
          <div className="grid grid-cols-2 gap-3">
            {["fruits", "vegetables", "dairy", "grains"].map((category) => (
              <label key={category} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-primary">
                <input 
                  checked={formData.category === category}
                  onChange={() => setFormData({...formData, category})}
                  className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  type="radio"
                  name="category"
                />
                <span className="text-sm font-medium text-[#111418] capitalize">{category}</span>
              </label>
            ))}
          </div>
        </section>
      </main>

      {/* Voice AI Overlay (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
        {/* Floating Assistant Bubble */}
        <div className="w-full max-w-[480px] px-4 pb-8 pointer-events-auto">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-200 p-6 flex flex-col items-center gap-4"
          >
            {/* Listening State */}
            <div className="flex items-center gap-1 h-10">
              {isListening && [...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 16 + 8}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-1">
                {isListening ? "I'm listening..." : "Tap to speak"}
              </p>
              <p className="text-gray-500 text-base italic leading-relaxed">
                {isListening 
                  ? '"Add 50kg Apples at 200 rupees per kg"'
                  : 'Say "Add product" to start'
                }
              </p>
            </div>
            {/* Mic Toggle Button */}
            <button 
              onClick={toggleListening}
              className={cn(
                "size-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all",
                isListening ? "bg-red-500 text-white shadow-red-500/30" : "bg-primary text-white shadow-primary/30"
              )}
            >
              <span className="material-symbols-outlined text-3xl">
                {isListening ? "stop" : "mic"}
              </span>
            </button>
          </motion.div>
        </div>
        {/* Safe Area Spacer for iOS */}
        <div className="h-8 w-full bg-white border-t border-gray-100"></div>
      </div>
    </div>
  );
}