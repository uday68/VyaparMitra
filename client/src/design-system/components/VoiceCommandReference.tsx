import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceCommand {
  command: string;
  description: string;
  example?: string;
  category?: string;
}

interface VoiceCommandReferenceProps {
  commands: VoiceCommand[];
  className?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export function VoiceCommandReference({ 
  commands, 
  className,
  isCollapsible = true,
  defaultExpanded = false
}: VoiceCommandReferenceProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Group commands by category
  const groupedCommands = commands.reduce((acc, command) => {
    const category = command.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(command);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  const toggleExpanded = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div 
      className={cn(
        "bg-white dark:bg-neutral-900 rounded-xl border-2 border-neutral-200 dark:border-neutral-700",
        "shadow-sm transition-all duration-200",
        className
      )}
    >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700",
          isCollapsible && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800"
        )}
        onClick={toggleExpanded}
        role={isCollapsible ? "button" : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        aria-expanded={isCollapsible ? isExpanded : undefined}
        aria-label={isCollapsible ? "Toggle voice commands reference" : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-purple text-xl">
            record_voice_over
          </span>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Voice Commands
          </h3>
        </div>
        
        {isCollapsible && (
          <span 
            className={cn(
              "material-symbols-outlined text-neutral-500 dark:text-neutral-400 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          >
            expand_more
          </span>
        )}
      </div>

      {/* Commands content */}
      {(!isCollapsible || isExpanded) && (
        <div className="p-4 space-y-6">
          {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
            <div key={category} className="space-y-3">
              {/* Category header */}
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                {category}
              </h4>
              
              {/* Commands in category */}
              <div className="space-y-3">
                {categoryCommands.map((command, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border border-neutral-200 dark:border-neutral-700",
                      "bg-neutral-50 dark:bg-neutral-800/50 transition-colors duration-200",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {/* Command and description */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-primary-purple text-sm">
                            mic
                          </span>
                          <code className={cn(
                            "text-sm font-mono font-semibold px-2 py-1 rounded",
                            "bg-primary-purple/10 text-primary-purple",
                            "border border-primary-purple/20"
                          )}>
                            "{command.command}"
                          </code>
                        </div>
                        
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {command.description}
                        </p>
                        
                        {/* Example usage */}
                        {command.example && (
                          <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                            <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                              Example:
                            </p>
                            <code className="text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                              {command.example}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Help text */}
          <div className={cn(
            "mt-6 p-3 rounded-lg",
            "bg-primary-purple/5 border border-primary-purple/20"
          )}>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary-purple text-sm mt-0.5">
                info
              </span>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p className="font-semibold mb-1">Tips for better voice recognition:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Speak clearly and at a normal pace</li>
                  <li>Use the exact command phrases shown above</li>
                  <li>Wait for the listening indicator before speaking</li>
                  <li>Minimize background noise when possible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}