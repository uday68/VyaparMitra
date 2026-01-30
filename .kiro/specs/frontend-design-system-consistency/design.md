# Design Document: Frontend Design System Consistency

## Overview

This design establishes a comprehensive design system for VyaparMitra's frontend to ensure visual consistency across all 25+ React pages. The system is based on the design references found in `stitch_ai_assisted_negotiation_chat/` directory and addresses current inconsistencies in colors, typography, spacing, and component styling.

The design system follows a token-based approach using CSS custom properties and Tailwind CSS, enabling efficient theme switching, dark mode support, and maintainable styling patterns. All components will be rebuilt to match the exact visual specifications from the design references.

## Architecture

### Design Token System

The design system uses a hierarchical token structure:

```
Global Tokens (Primitive) → Semantic Tokens → Component Tokens
```

**Global Tokens**: Raw values (colors, fonts, spacing)
**Semantic Tokens**: Purpose-based tokens (primary, secondary, success)
**Component Tokens**: Component-specific tokens (button-primary-bg, card-shadow)

### Technology Stack

- **CSS Custom Properties**: For runtime theme switching
- **Tailwind CSS**: For utility-first styling with custom configuration
- **Styled Components**: For complex component styling when needed
- **Storybook**: For component documentation and testing
- **React Context**: For theme management and dark mode

### File Structure

```
client/src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── VoiceUI/
│   │   └── index.ts
│   ├── themes/
│   │   ├── light.ts
│   │   ├── dark.ts
│   │   └── ThemeProvider.tsx
│   └── utils/
│       ├── responsive.ts
│       └── animations.ts
```

## Components and Interfaces

### Core Design Tokens

#### Color System

Based on design reference analysis, the system supports multiple color schemes:

```typescript
interface ColorTokens {
  // Primary colors from design references
  primary: {
    blue: '#1c74e9',      // Customer-focused pages
    green: '#2bee6c',     // Success states, welcome
    purple: '#8743f4',    // Voice features
    blueVariant: '#4387f4' // Secondary actions
  };
  
  // Semantic colors
  semantic: {
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db'
  };
  
  // Neutral colors
  neutral: {
    50: '#f6f7f8',   // background-light
    100: '#dbe6df',  // borders
    200: '#61896f',  // muted text
    800: '#111813',  // dark text
    900: '#102216'   // background-dark
  };
}
```

#### Typography System

```typescript
interface TypographyTokens {
  fontFamily: {
    display: ['Work Sans', 'sans-serif'],
    body: ['Work Sans', 'sans-serif']
  };
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '2rem',    // 32px - Headlines
  };
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  };
}
```

#### Spacing System

```typescript
interface SpacingTokens {
  space: {
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    12: '3rem',     // 48px
    16: '4rem'      // 64px
  };
  
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px'
  };
}
```

### Component Specifications

#### Button Component

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'voice';
  size: 'sm' | 'md' | 'lg';
  colorScheme?: 'blue' | 'green' | 'purple';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Variants based on design references:
// - primary: Solid background, white text
// - secondary: Outline style with colored border
// - ghost: Transparent background, colored text
// - voice: Special styling for voice interactions
```

#### Card Component

```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'glass';
  padding: 'sm' | 'md' | 'lg';
  borderRadius?: 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

// Design reference patterns:
// - Product cards: elevated with medium shadow
// - Voice panels: glass effect with border
// - Language selection: outlined with hover states
```

#### Header Component

```typescript
interface HeaderProps {
  title: string;
  showBack?: boolean;
  showLanguageSelector?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple';
  leftAction?: ReactNode;
  rightAction?: ReactNode;
}

// Consistent pattern from design references:
// - Left: Back button or brand icon
// - Center: Page title
// - Right: Language selector or action
```

### Voice UI Components

#### Voice Assistant Banner

```typescript
interface VoiceAssistantBannerProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  message: string;
  onToggle: () => void;
  colorScheme?: 'blue' | 'green' | 'purple';
}

// Features from design references:
// - Floating panel design
// - Microphone icon with status indicator
// - Animated waveform during active states
// - Status-based color changes
```

#### Waveform Animation

```typescript
interface WaveformProps {
  isActive: boolean;
  amplitude: number;
  colorScheme?: 'blue' | 'green' | 'purple';
  size: 'sm' | 'md' | 'lg';
}

// Animation patterns:
// - Smooth wave motion during voice input
// - Color-coded based on current theme
// - Responsive sizing for different contexts
```

#### Voice Status Indicator

```typescript
interface VoiceStatusProps {
  status: 'idle' | 'listening' | 'processing' | 'error';
  size: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Status indicators:
// - idle: Muted microphone icon
// - listening: Animated microphone with pulse
// - processing: Loading spinner
// - error: Error icon with red color
```

## Data Models

### Theme Configuration

```typescript
interface Theme {
  name: 'light' | 'dark';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  animations: AnimationTokens;
}

interface ThemeContextValue {
  theme: Theme;
  colorScheme: 'blue' | 'green' | 'purple';
  toggleTheme: () => void;
  setColorScheme: (scheme: 'blue' | 'green' | 'purple') => void;
}
```

### Component Variants

```typescript
interface ComponentVariants {
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

interface ComponentStyle {
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
```

### Responsive Breakpoints

```typescript
interface BreakpointConfig {
  mobile: '320px';
  tablet: '768px';
  desktop: '1024px';
  wide: '1280px';
}

interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}
```

Now I need to use the prework tool to analyze the acceptance criteria before writing the Correctness Properties section:
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties related to design token usage (1.1-1.7, 4.1) can be combined into comprehensive token validation properties
- Component styling properties (2.1-2.7) can be consolidated into component consistency properties  
- Voice UI properties (3.1-3.6) can be combined into voice component validation properties
- Responsive design properties (5.1-5.7) can be consolidated into responsive behavior properties
- Theme-related properties (6.1-6.7) can be combined into theme consistency properties
- Accessibility properties (7.3-7.6) can be consolidated into accessibility compliance properties

### Core Properties

**Property 1: Design Token Consistency**
*For any* component in the design system, all styling values should reference design tokens instead of hardcoded values, and all tokens should match the values extracted from design references
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 4.1**

**Property 2: Component Variant Completeness**
*For any* component type (button, card, navigation, form, modal), all required variants from design references should be implemented with correct styling and states
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

**Property 3: Voice UI Component Consistency**
*For any* voice UI component, the styling and behavior should match design reference patterns and work correctly across all states (idle, listening, processing, error)
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

**Property 4: Page-Level Style Consistency**
*For any* page in the application, the styling should use design tokens consistently and follow the appropriate color scheme and layout patterns for its page type
**Validates: Requirements 4.2, 4.3, 4.5, 4.6, 4.7**

**Property 5: Responsive Design Compliance**
*For any* component or page, the layout should adapt correctly at all specified breakpoints (320px, 768px, 1024px, 1280px) and maintain usability across device sizes
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

**Property 6: Theme Switching Consistency**
*For any* component, switching between light and dark themes should update all colors automatically using design tokens while maintaining proper contrast ratios and visual hierarchy
**Validates: Requirements 1.6, 6.1, 6.2, 6.4, 6.5, 6.6, 6.7**

**Property 7: Theme Persistence**
*For any* user session, the selected theme preference should be saved and restored across browser sessions without loss
**Validates: Requirements 6.3**

**Property 8: Accessibility Compliance**
*For any* component, all interactive elements should be keyboard accessible, have proper ARIA labels, and meet WCAG 2.1 AA contrast requirements
**Validates: Requirements 7.3, 7.4, 7.5, 7.6**

**Property 9: Performance Optimization**
*For any* styling implementation, CSS custom properties should be used for theme switching, font loading should be optimized, and the solution should support server-side rendering
**Validates: Requirements 7.1, 7.2, 7.7**

**Property 10: TypeScript Type Safety**
*For any* design token or component prop, proper TypeScript types should be provided and exported for type-safe usage
**Validates: Requirements 9.4**

## Error Handling

### Design Token Fallbacks

The design system implements graceful fallbacks for missing or invalid design tokens:

```typescript
// Token resolution with fallbacks
const getToken = (tokenPath: string, fallback: string) => {
  const token = resolveToken(tokenPath);
  return token || fallback;
};

// Example usage
const primaryColor = getToken('colors.primary.blue', '#1c74e9');
```

### Theme Switching Errors

Theme switching includes error handling for:

- **Invalid theme data**: Falls back to light theme
- **Storage errors**: Uses in-memory theme state
- **CSS custom property failures**: Falls back to hardcoded values

### Component Rendering Errors

Components implement error boundaries and fallback rendering:

```typescript
// Component error boundary
const ComponentErrorBoundary = ({ children, fallback }) => {
  // Error boundary implementation
  // Falls back to unstyled but functional component
};
```

### Responsive Design Failures

Responsive design includes fallbacks for:

- **Unsupported CSS features**: Progressive enhancement approach
- **JavaScript failures**: CSS-only responsive behavior
- **Viewport detection errors**: Assumes mobile-first layout

## Testing Strategy

### Dual Testing Approach

The design system uses both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions
- Component rendering with different props
- Theme switching edge cases  
- Accessibility compliance for specific scenarios
- Error boundary behavior

**Property Tests**: Verify universal properties across all inputs
- Design token consistency across all components
- Theme switching behavior for all color combinations
- Responsive behavior across all breakpoint ranges
- Accessibility compliance across all component variants

### Property-Based Testing Configuration

- **Testing Library**: React Testing Library with @testing-library/jest-dom
- **Property Testing**: Fast-check for JavaScript property-based testing
- **Visual Testing**: Chromatic for visual regression testing
- **Accessibility Testing**: @axe-core/react for automated accessibility testing

Each property test runs a minimum of 100 iterations and includes:

```typescript
// Example property test structure
describe('Design Token Consistency', () => {
  it('should use design tokens for all styling values', () => {
    fc.assert(fc.property(
      fc.constantFrom(...allComponents),
      (Component) => {
        // Test that component uses design tokens
        // Tag: Feature: frontend-design-system-consistency, Property 1: Design Token Consistency
      }
    ), { numRuns: 100 });
  });
});
```

### Testing Categories

**Visual Regression Tests**:
- Storybook stories for all components
- Chromatic integration for automated visual testing
- Cross-browser compatibility testing

**Accessibility Tests**:
- Automated axe-core testing for all components
- Keyboard navigation testing
- Screen reader compatibility testing
- Color contrast validation

**Performance Tests**:
- CSS bundle size monitoring
- Font loading performance
- Theme switching performance
- Component rendering performance

**Integration Tests**:
- Theme provider integration
- Component interaction testing
- Responsive behavior testing
- Error boundary testing

### Test Organization

```
client/src/design-system/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   ├── Card.test.tsx
│   │   └── VoiceUI.test.tsx
│   ├── tokens/
│   │   ├── colors.test.ts
│   │   └── typography.test.ts
│   ├── themes/
│   │   └── ThemeProvider.test.tsx
│   └── properties/
│       ├── token-consistency.test.ts
│       ├── component-variants.test.ts
│       └── responsive-design.test.ts
├── __stories__/
│   ├── Button.stories.tsx
│   ├── Card.stories.tsx
│   └── VoiceUI.stories.tsx
└── __visual__/
    ├── chromatic.config.js
    └── visual-regression.test.ts
```

Each test file includes:
- Unit tests for specific functionality
- Property tests for universal behavior
- Visual regression tests for UI consistency
- Accessibility tests for compliance
- Performance tests for optimization

The testing strategy ensures that the design system maintains consistency, accessibility, and performance while providing comprehensive coverage for all requirements.