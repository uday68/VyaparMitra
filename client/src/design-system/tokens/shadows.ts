import { ShadowTokens } from '../types';

// Shadow tokens based on design references
export const shadowTokens: ShadowTokens = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Subtle shadow for cards
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Standard card shadow
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Elevated elements
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Floating elements
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Modal overlays
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' // Inner shadow for inputs
};

// Design reference specific shadows
export const designShadows = {
  // Card shadows from design references
  card: '0 2px 8px rgba(0,0,0,0.05)', // From customer_bids_dashboard
  cardElevated: '0 4px 12px rgba(0,0,0,0.08)', // From customer_deal_confirmation
  cardVoice: '0 4px 12px rgba(67,135,244,0.1)', // Voice-specific card shadow
  
  // Voice UI shadows
  voiceBanner: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // QR card shadow from vendor_dashboard
  voiceButton: '0 2px 4px rgba(0,0,0,0.2)', // Voice button shadow
  
  // Button shadows
  buttonPrimary: '0 2px 4px rgba(0,0,0,0.1)',
  buttonElevated: '0 4px 8px rgba(0,0,0,0.12)',
  
  // Navigation shadows
  header: '0 1px 3px rgba(0,0,0,0.1)',
  bottomNav: '0 -4px 20px rgba(0,0,0,0.05)', // From voice negotiation footer
  
  // Modal and overlay shadows
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

// CSS Custom Properties for shadows
export const shadowCustomProperties = {
  '--shadow-none': shadowTokens.none,
  '--shadow-sm': shadowTokens.sm,
  '--shadow-md': shadowTokens.md,
  '--shadow-lg': shadowTokens.lg,
  '--shadow-xl': shadowTokens.xl,
  '--shadow-2xl': shadowTokens['2xl'],
  '--shadow-inner': shadowTokens.inner,
  
  // Design reference shadows
  '--shadow-card': designShadows.card,
  '--shadow-card-elevated': designShadows.cardElevated,
  '--shadow-card-voice': designShadows.cardVoice,
  '--shadow-voice-banner': designShadows.voiceBanner,
  '--shadow-voice-button': designShadows.voiceButton,
  '--shadow-button-primary': designShadows.buttonPrimary,
  '--shadow-button-elevated': designShadows.buttonElevated,
  '--shadow-header': designShadows.header,
  '--shadow-bottom-nav': designShadows.bottomNav,
  '--shadow-modal': designShadows.modal,
  '--shadow-dropdown': designShadows.dropdown,
};

// Tailwind CSS shadow configuration
export const tailwindShadows = {
  boxShadow: {
    ...shadowTokens,
    // Design reference specific shadows
    'card': designShadows.card,
    'card-elevated': designShadows.cardElevated,
    'card-voice': designShadows.cardVoice,
    'voice-banner': designShadows.voiceBanner,
    'voice-button': designShadows.voiceButton,
    'button-primary': designShadows.buttonPrimary,
    'button-elevated': designShadows.buttonElevated,
    'header': designShadows.header,
    'bottom-nav': designShadows.bottomNav,
    'modal': designShadows.modal,
    'dropdown': designShadows.dropdown,
  }
};

// Dark mode shadow adjustments
export const darkModeShadows = {
  card: '0 2px 8px rgba(0,0,0,0.3)',
  cardElevated: '0 4px 12px rgba(0,0,0,0.4)',
  voiceBanner: '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};