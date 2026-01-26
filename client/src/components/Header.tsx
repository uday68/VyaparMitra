import { Link } from "wouter";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../hooks/useAuth";
import { LanguageSelector } from "./LanguageSelector";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLanguageSelector?: boolean;
  showUserInfo?: boolean;
}

export function Header({ 
  title, 
  showBack = false, 
  showLanguageSelector = true,
  showUserInfo = true
}: HeaderProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  
  // Use translation for default title if no title provided
  const displayTitle = title || t('shop.title');

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center px-4 py-3 justify-between">
        {showBack ? (
          <Link href="/" className="text-slate-800 flex size-10 shrink-0 items-center justify-start hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </Link>
        ) : (
          <div className="text-primary flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-full">
            <span className="material-symbols-outlined text-xl">translate</span>
          </div>
        )}
        
        <h1 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          {displayTitle}
        </h1>

        <div className="flex items-center space-x-2">
          {showLanguageSelector && (
            <LanguageSelector variant="icon-only" className="shrink-0" />
          )}
          
          {showUserInfo && isAuthenticated && user && (
            <Link 
              href="/profile" 
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">
                  {user.type === 'vendor' ? 'storefront' : 'person'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user.name}
              </span>
            </Link>
          )}
          
          {!showLanguageSelector && !showUserInfo && (
            <div className="size-10" /> /* Spacer for balance */
          )}
        </div>
      </div>
    </header>
  );
}
