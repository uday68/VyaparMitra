/**
 * Performance utilities for the design system
 * Optimizes CSS custom properties, font loading, and theme switching
 */

// CSS Custom Properties optimization
export const cssCustomProperties = {
  // Core color properties for efficient theme switching
  colors: {
    '--color-primary': 'var(--color-primary-blue)',
    '--color-primary-blue': '#1d4ed8',
    '--color-primary-green': '#15803d', 
    '--color-primary-purple': '#7c3aed',
    '--color-primary-blue-variant': '#2563eb',
    
    '--color-success': '#15803d',
    '--color-warning': '#b45309',
    '--color-error': '#dc2626',
    '--color-info': '#2563eb',
    
    '--color-background': '#ffffff',
    '--color-background-light': '#f6f7f8',
    '--color-background-muted': '#f0f2f4',
    '--color-foreground': '#111418',
    '--color-muted': '#637388',
    '--color-border': '#dbe6df',
    
    '--color-card-background': '#ffffff',
    '--color-card-border': '#dbe6df',
  },
  
  // Dark theme overrides
  darkColors: {
    '--color-background': '#111821',
    '--color-background-light': '#171022',
    '--color-background-muted': '#231a31',
    '--color-foreground': '#ffffff',
    '--color-muted': '#6b7280',
    '--color-border': 'rgba(255, 255, 255, 0.1)',
    
    '--color-card-background': '#1a1a1a',
    '--color-card-border': 'rgba(255, 255, 255, 0.1)',
  },
  
  // Typography properties
  typography: {
    '--font-family-display': '"Work Sans", sans-serif',
    '--font-family-body': '"Work Sans", sans-serif',
    
    '--font-size-xs': '0.75rem',
    '--font-size-sm': '0.875rem',
    '--font-size-base': '1rem',
    '--font-size-lg': '1.125rem',
    '--font-size-xl': '1.25rem',
    '--font-size-2xl': '2rem',
    '--font-size-3xl': '3rem',
    
    '--font-weight-light': '300',
    '--font-weight-normal': '400',
    '--font-weight-medium': '500',
    '--font-weight-semibold': '600',
    '--font-weight-bold': '700',
    
    '--line-height-tight': '1.25',
    '--line-height-normal': '1.5',
    '--line-height-relaxed': '1.75',
  },
  
  // Spacing properties
  spacing: {
    '--space-1': '0.25rem',
    '--space-2': '0.5rem',
    '--space-3': '0.75rem',
    '--space-4': '1rem',
    '--space-5': '1.25rem',
    '--space-6': '1.5rem',
    '--space-8': '2rem',
    '--space-10': '2.5rem',
    '--space-12': '3rem',
    '--space-16': '4rem',
    '--space-20': '5rem',
    '--space-24': '6rem',
    
    '--radius-none': '0',
    '--radius-sm': '0.25rem',
    '--radius-md': '0.5rem',
    '--radius-lg': '0.75rem',
    '--radius-xl': '1rem',
    '--radius-2xl': '1.5rem',
    '--radius-3xl': '2rem',
    '--radius-full': '9999px',
  },
  
  // Animation properties
  animations: {
    '--duration-fast': '150ms',
    '--duration-normal': '200ms',
    '--duration-slow': '300ms',
    '--ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    '--ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    '--ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
};

// Efficient theme switching using CSS custom properties
export const applyTheme = (theme: 'light' | 'dark', colorScheme: 'blue' | 'green' | 'purple' = 'blue') => {
  const root = document.documentElement;
  
  // Apply base properties
  Object.entries(cssCustomProperties.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Apply theme-specific overrides
  if (theme === 'dark') {
    Object.entries(cssCustomProperties.darkColors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }
  
  // Apply color scheme
  const primaryColor = colorScheme === 'green' 
    ? cssCustomProperties.colors['--color-primary-green']
    : colorScheme === 'purple'
    ? cssCustomProperties.colors['--color-primary-purple'] 
    : cssCustomProperties.colors['--color-primary-blue'];
    
  root.style.setProperty('--color-primary', primaryColor);
  
  // Apply typography properties
  Object.entries(cssCustomProperties.typography).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Apply spacing properties
  Object.entries(cssCustomProperties.spacing).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Apply animation properties
  Object.entries(cssCustomProperties.animations).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Font loading optimization
export const optimizeFontLoading = () => {
  // Preload critical fonts
  const preloadFont = (fontUrl: string, fontDisplay: string = 'swap') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = fontUrl;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  // Preload Work Sans font variants
  const workSansFonts = [
    '/fonts/work-sans-400.woff2', // Normal
    '/fonts/work-sans-500.woff2', // Medium
    '/fonts/work-sans-600.woff2', // Semibold
    '/fonts/work-sans-700.woff2', // Bold
  ];

  workSansFonts.forEach(fontUrl => {
    preloadFont(fontUrl);
  });

  // Use font-display: swap for better performance
  const fontFaceCSS = `
    @font-face {
      font-family: 'Work Sans';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/fonts/work-sans-400.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Work Sans';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('/fonts/work-sans-500.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Work Sans';
      font-style: normal;
      font-weight: 600;
      font-display: swap;
      src: url('/fonts/work-sans-600.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Work Sans';
      font-style: normal;
      font-weight: 700;
      font-display: swap;
      src: url('/fonts/work-sans-700.woff2') format('woff2');
    }
  `;

  // Inject font CSS
  const style = document.createElement('style');
  style.textContent = fontFaceCSS;
  document.head.appendChild(style);
};

// CSS-in-JS optimization for server-side rendering
export const generateCriticalCSS = (theme: 'light' | 'dark' = 'light') => {
  const properties = {
    ...cssCustomProperties.colors,
    ...cssCustomProperties.typography,
    ...cssCustomProperties.spacing,
    ...cssCustomProperties.animations,
    ...(theme === 'dark' ? cssCustomProperties.darkColors : {})
  };

  const cssString = Object.entries(properties)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `:root {\n${cssString}\n}`;
};

// Performance monitoring utilities
export const measureThemeSwitchPerformance = () => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`Theme switch took ${duration.toFixed(2)}ms - consider optimization`);
      }
      
      return duration;
    }
  };
};

// Debounced theme switching for better performance
export const createDebouncedThemeSwitch = (delay: number = 100) => {
  let timeoutId: NodeJS.Timeout;
  
  return (theme: 'light' | 'dark', colorScheme: 'blue' | 'green' | 'purple') => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      const perf = measureThemeSwitchPerformance();
      applyTheme(theme, colorScheme);
      perf.end();
    }, delay);
  };
};

// CSS bundle size optimization
export const getCSSBundleSize = () => {
  const stylesheets = Array.from(document.styleSheets);
  let totalSize = 0;
  
  stylesheets.forEach(stylesheet => {
    try {
      const rules = Array.from(stylesheet.cssRules || []);
      const cssText = rules.map(rule => rule.cssText).join('\n');
      totalSize += new Blob([cssText]).size;
    } catch (e) {
      // Cross-origin stylesheets may not be accessible
      console.warn('Could not access stylesheet for size calculation');
    }
  });
  
  return totalSize;
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Optimize font loading
  optimizeFontLoading();
  
  // Set up critical CSS
  const criticalCSS = generateCriticalCSS();
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  style.setAttribute('data-critical-css', 'true');
  document.head.insertBefore(style, document.head.firstChild);
  
  // Monitor CSS bundle size in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      const bundleSize = getCSSBundleSize();
      console.log(`CSS bundle size: ${(bundleSize / 1024).toFixed(2)}KB`);
    }, 1000);
  }
};