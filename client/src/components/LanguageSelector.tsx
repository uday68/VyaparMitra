import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'compact' | 'icon-only';
  showFlag?: boolean;
}

export function LanguageSelector({ 
  className, 
  variant = 'default',
  showFlag = true 
}: LanguageSelectorProps) {
  const { language, changeLanguage, supportedLanguages } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === language) return;
    
    setIsChanging(true);
    try {
      await changeLanguage(newLanguage);
      // Store language preference in localStorage
      localStorage.setItem('vyapar-mitra-language', newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguageInfo = supportedLanguages[language as keyof typeof supportedLanguages];

  if (variant === 'icon-only') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", className)}
            disabled={isChanging}
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only">Select language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(supportedLanguages).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {showFlag && <span className="text-lg">{info.flag}</span>}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{info.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{info.name}</span>
                </div>
              </div>
              {language === code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 gap-1", className)}
            disabled={isChanging}
          >
            {showFlag && <span className="text-sm">{currentLanguageInfo?.flag}</span>}
            <span className="text-xs font-medium">
              {currentLanguageInfo?.nativeName || language.toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {Object.entries(supportedLanguages).map(([code, info]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleLanguageChange(code)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {showFlag && <span className="text-lg">{info.flag}</span>}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{info.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{info.name}</span>
                </div>
              </div>
              {language === code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("gap-2", className)}
          disabled={isChanging}
        >
          <Globe className="h-4 w-4" />
          {showFlag && <span>{currentLanguageInfo?.flag}</span>}
          <span className="font-medium">
            {currentLanguageInfo?.nativeName || language.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {Object.entries(supportedLanguages).map(([code, info]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code)}
            className="flex items-center justify-between p-3"
          >
            <div className="flex items-center gap-3">
              {showFlag && <span className="text-xl">{info.flag}</span>}
              <div className="flex flex-col">
                <span className="font-medium">{info.nativeName}</span>
                <span className="text-sm text-muted-foreground">{info.name}</span>
              </div>
            </div>
            {language === code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Language grid selector for welcome/onboarding screens
export function LanguageGrid({ 
  onLanguageSelect, 
  className 
}: { 
  onLanguageSelect?: (language: string) => void;
  className?: string;
}) {
  const { language, changeLanguage, supportedLanguages } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = async (newLanguage: string) => {
    setIsChanging(true);
    try {
      await changeLanguage(newLanguage);
      localStorage.setItem('vyapar-mitra-language', newLanguage);
      onLanguageSelect?.(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", className)}>
      {Object.entries(supportedLanguages).map(([code, info]) => (
        <Button
          key={code}
          variant={language === code ? "default" : "outline"}
          className="h-auto p-4 flex flex-col gap-2"
          onClick={() => handleLanguageSelect(code)}
          disabled={isChanging}
        >
          <span className="text-2xl">{info.flag}</span>
          <div className="text-center">
            <div className="font-medium text-sm">{info.nativeName}</div>
            <div className="text-xs text-muted-foreground">{info.name}</div>
          </div>
          {language === code && <Check className="h-4 w-4 absolute top-2 right-2" />}
        </Button>
      ))}
    </div>
  );
}