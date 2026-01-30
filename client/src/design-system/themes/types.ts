import { Theme, ThemeContextValue } from '../types';

export type { Theme, ThemeContextValue };

export type ColorScheme = 'blue' | 'green' | 'purple';
export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  systemPreference: boolean;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  defaultColorScheme?: ColorScheme;
  storageKey?: string;
}