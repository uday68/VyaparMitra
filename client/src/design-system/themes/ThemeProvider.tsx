import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeContextValue } from '../types';
import { ColorScheme, ThemeMode, ThemeProviderProps } from './types';
import { lightTheme, lightThemeProperties } from './light';
import { darkTheme, darkThemeProperties } from './dark';

// Create theme context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  defaultColorScheme = 'blue',
  storageKey = 'vyaparmitra-theme'
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultTheme);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme);

  // Get current theme based on mode
  const currentTheme: Theme = themeMode === 'light' ? lightTheme : darkTheme;

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const { mode, scheme } = JSON.parse(stored);
        if (mode && ['light', 'dark'].includes(mode)) {
          setThemeMode(mode);
        }
        if (scheme && ['blue', 'green', 'purple'].includes(scheme)) {
          setColorScheme(scheme);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, [storageKey]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        mode: themeMode,
        scheme: colorScheme
      }));
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [themeMode, colorScheme, storageKey]);

  // Apply CSS custom properties when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const properties = themeMode === 'light' ? lightThemeProperties : darkThemeProperties;
    
    // Apply all CSS custom properties
    Object.entries(properties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply theme class to body for Tailwind CSS
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeMode}`);
    
    // Apply color scheme class
    document.body.className = document.body.className.replace(/scheme-\w+/g, '');
    document.body.classList.add(`scheme-${colorScheme}`);
  }, [themeMode, colorScheme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Context value
  const contextValue: ThemeContextValue = {
    theme: currentTheme,
    colorScheme,
    toggleTheme,
    setColorScheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get current theme mode
export const useThemeMode = (): [ThemeMode, () => void] => {
  const { theme, toggleTheme } = useTheme();
  return [theme.name, toggleTheme];
};

// Hook to get current color scheme
export const useColorScheme = (): [ColorScheme, (scheme: ColorScheme) => void] => {
  const { colorScheme, setColorScheme } = useTheme();
  return [colorScheme, setColorScheme];
};