import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  currentPage?: "shop" | "bids" | "account";
}

export function BottomNav({ currentPage }: BottomNavProps = {}) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", key: "shop", label: "Shop", icon: "storefront" },
    { href: "/vendor", key: "bids", label: "My Bids", icon: "gavel" },
    { href: "#", key: "account", label: "Account", icon: "account_circle" },
  ];

  return (
    <nav className="bg-white border-t border-gray-100 flex justify-around items-center pt-2 pb-8">
      {navItems.map((item) => {
        const isActive = currentPage === item.key || location === item.href;
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex flex-col items-center gap-1",
              isActive ? "text-primary" : "text-[#637388]"
            )}
          >
            <span className={cn(
              "material-symbols-outlined",
              isActive ? "font-bold" : ""
            )}>
              {item.icon}
            </span>
            <span className={cn(
              "text-xs",
              isActive ? "font-bold" : "font-medium"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
