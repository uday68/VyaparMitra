import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function FormField({ 
  label, 
  error, 
  required = false, 
  children, 
  className,
  description 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {label}
        {required && <span className="text-error ml-1" aria-label="required">*</span>}
      </label>
      {description && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400 -mt-1">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-sm text-error flex items-center gap-1" role="alert">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}