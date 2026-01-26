import { useNegotiations } from "@/hooks/use-negotiations";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { Link } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Vendor() {
  const { data: negotiations, isLoading } = useNegotiations();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <Header title="My Bids" />

      <main className="flex-1 px-4 pt-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
             {[1, 2, 3].map(i => <div key={i} className="bg-white h-24 rounded-xl animate-pulse" />)}
          </div>
        ) : negotiations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">gavel</span>
            <p>No active bids yet.</p>
            <Link href="/" className="mt-4 text-primary font-medium hover:underline">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {negotiations?.map((neg) => (
              <Link key={neg.id} href={`/chat/${neg.id}`}>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800">{neg.product.name}</h3>
                      <p className="text-xs text-slate-500">
                        {format(new Date(neg.createdAt!), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                      neg.status === 'accepted' ? "bg-green-100 text-green-700" :
                      neg.status === 'rejected' ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {neg.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div 
                      className="size-10 bg-slate-100 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${neg.product.imageUrl})` }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-slate-600">
                        Last Offer: <span className="font-bold text-slate-900">₹{neg.finalPrice || neg.product.price}</span>
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
