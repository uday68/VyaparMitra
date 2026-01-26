import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Shop", icon: "storefront" },
    { href: "/vendor", label: "My Bids", icon: "gavel" },
    { href: "#", label: "Account", icon: "account_circle" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 safe-area-bottom">
      <div className="flex justify-around items-center pt-2 pb-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center gap-1 py-2 px-4 transition-colors duration-200",
              isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
            )}>
              <span className={cn(
                "material-symbols-outlined text-2xl transition-transform duration-200",
                isActive ? "font-bold scale-110" : "font-normal"
              )}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
