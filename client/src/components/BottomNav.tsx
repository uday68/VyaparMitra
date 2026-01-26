import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "../hooks/useTranslation";

interface BottomNavProps {
  currentPage?: "shop" | "bids" | "account";
}

export function BottomNav({ currentPage }: BottomNavProps = {}) {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { href: "/", key: "shop", label: t('navigation.shop'), icon: "storefront" },
    { href: "/vendor", key: "bids", label: t('navigation.negotiations'), icon: "gavel" },
    { href: "#", key: "account", label: t('navigation.profile'), icon: "account_circle" },
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
