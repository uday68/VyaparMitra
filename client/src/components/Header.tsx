import { Link } from "wouter";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export function Header({ title = "Sanjay's Fruits", showBack = false }: HeaderProps) {
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
        
        <h1 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          {title}
        </h1>

        {!showBack && (
           <div className="size-10" /> /* Spacer for balance */
        )}
      </div>
    </header>
  );
}
