// Design System TypeScript Interfaces

export interface ColorTokens {
  // Primary colors from design references
  primary: {
    blue: string;      // Customer-focused pages
    green: string;     // Success states, welcome
    purple: string;    // Voice features
    blueVariant: string; // Secondary actions
  };
  
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // Neutral colors
  neutral: {
    50: string;   // background-light
    100: string;  // borders
    200: string;  // muted text
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;  // dark text
    900: string;  // background-dark
  };
}

export interface TypographyTokens {
  fontFamily: {
    display: string[];
    body: string[];
  };
  
  fontSize: {
    xs: string;    // 12px
    sm: string;    // 14px
    base: string;  // 16px
    lg: string;    // 18px
    xl: string;    // 20px
    '2xl': string; // 32px - Headlines
    '3xl': string; // 48px
  };
  
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface SpacingTokens {
  space: {
    1: string;   // 4px
    2: string;   // 8px
    3: string;   // 12px
    4: string;   // 16px
    5: string;   // 20px
    6: string;   // 24px
    8: string;   // 32px
    10: string;  // 40px
    12: string;  // 48px
    16: string;  // 64px
    20: string;  // 80px
    24: string;  // 96px
  };
  
  borderRadius: {
    none: string;
    sm: string;   // 4px
    md: string;   // 8px
    lg: string;   // 12px
    xl: string;   // 16px
    '2xl': string; // 24px
    '3xl': string; // 32px
    full: string;
  };
}

export interface ShadowTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface AnimationTokens {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  animations: AnimationTokens;
}

export interface ThemeContextValue {
  theme: Theme;
  colorScheme: 'blue' | 'green' | 'purple';
  toggleTheme: () => void;
  setColorScheme: (scheme: 'blue' | 'green' | 'purple') => void;
}

export interface ComponentVariants {
  button: {
    primary: ComponentStyle;
    secondary: ComponentStyle;
    ghost: ComponentStyle;
    voice: ComponentStyle;
  };
  
  card: {
    default: ComponentStyle;
    elevated: ComponentStyle;
    outlined: ComponentStyle;
    glass: ComponentStyle;
  };
}

export interface ComponentStyle {
  base: string;           // Base Tailwind classes
  variants: {
    [key: string]: string; // Variant-specific classes
  };
  states: {
    hover: string;
    focus: string;
    active: string;
    disabled: string;
  };
}

export interface BreakpointConfig {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}

// Component Props Interfaces
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'voice';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'blue' | 'green' | 'purple';
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
  borderRadius?: 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  showLanguageSelector?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple';
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export interface VoiceAssistantBannerProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  message: string;
  onToggle: () => void;
  colorScheme?: 'blue' | 'green' | 'purple';
  className?: string;
}

export interface WaveformProps {
  isActive: boolean;
  amplitude?: number;
  colorScheme?: 'blue' | 'green' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface VoiceStatusProps {
  status: 'idle' | 'listening' | 'processing' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}