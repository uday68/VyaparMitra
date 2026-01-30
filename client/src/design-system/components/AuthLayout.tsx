import React from 'react';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '../../components/LanguageSelector';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary/5 dark:from-neutral-950 dark:via-neutral-900 dark:to-primary/5 flex flex-col">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40 dark:opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSelector variant="compact" />
      </div>
      
      {/* Main Content */}
      <div className="relative flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-blue rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-white text-3xl">
                  storefront
                </span>
              </div>
              {/* Trust indicator */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-sm">
                  verified
                </span>
              </div>
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {title}
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-2">
              {subtitle}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <span className="material-symbols-outlined text-sm">security</span>
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className={cn("mt-8 sm:mx-auto sm:w-full sm:max-w-md", className)}>
          <div className="bg-white dark:bg-neutral-900 py-8 px-6 shadow-2xl shadow-neutral-900/10 dark:shadow-black/20 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 backdrop-blur-sm">
            {children}
          </div>
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex items-center justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">shield</span>
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Trusted Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}